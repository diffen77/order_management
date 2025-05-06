"""
Reporting service module for generating fulfillment reports.
"""
from typing import Dict, List, Optional, Any, Tuple
from uuid import UUID, uuid4
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from decimal import Decimal
import json
import csv
import io
from dateutil.relativedelta import relativedelta

from app.services.supabase import get_supabase_client
from app.schemas.fulfillment import (
    FulfillmentMetric, FulfillmentMetricsReport, FulfillmentPerformanceReport,
    FulfillmentExceptionReport, FulfillmentReportFilters, FulfillmentTimeMetrics,
    FulfillmentAccuracyMetrics, FulfillmentCostMetrics, FulfillmentVolumeMetrics
)


async def generate_metrics_report(filters: FulfillmentReportFilters) -> FulfillmentMetricsReport:
    """
    Generate a comprehensive metrics report for fulfillment.
    
    Args:
        filters: Report filters including date range, producer, and other criteria
        
    Returns:
        FulfillmentMetricsReport: Comprehensive metrics report
    """
    # Set default date range if not provided
    now = datetime.now()
    end_date = filters.end_date or now
    start_date = filters.start_date or (end_date - timedelta(days=30))
    
    # Calculate previous period for comparison if needed
    previous_start_date = None
    previous_end_date = None
    if filters.compare_to_previous:
        period_length = (end_date - start_date)
        previous_end_date = start_date
        previous_start_date = start_date - period_length
    
    # Get Supabase client
    supabase = get_supabase_client()
    
    # Run queries to get necessary data
    time_metrics = await _calculate_time_metrics(
        supabase, start_date, end_date, 
        previous_start_date, previous_end_date, filters
    )
    
    accuracy_metrics = await _calculate_accuracy_metrics(
        supabase, start_date, end_date,
        previous_start_date, previous_end_date, filters
    )
    
    cost_metrics = await _calculate_cost_metrics(
        supabase, start_date, end_date,
        previous_start_date, previous_end_date, filters
    )
    
    volume_metrics = await _calculate_volume_metrics(
        supabase, start_date, end_date,
        previous_start_date, previous_end_date, filters
    )
    
    # Create and return the report
    return FulfillmentMetricsReport(
        id=uuid4(),
        generated_at=now,
        period_start=start_date,
        period_end=end_date,
        filters=filters,
        time_metrics=time_metrics,
        accuracy_metrics=accuracy_metrics,
        cost_metrics=cost_metrics,
        volume_metrics=volume_metrics
    )


async def generate_performance_report(filters: FulfillmentReportFilters) -> FulfillmentPerformanceReport:
    """
    Generate a performance report for fulfillment operations.
    
    Args:
        filters: Report filters including date range, producer, and other criteria
        
    Returns:
        FulfillmentPerformanceReport: Performance report with producer and shipping method metrics
    """
    # Set default date range if not provided
    now = datetime.now()
    end_date = filters.end_date or now
    start_date = filters.start_date or (end_date - timedelta(days=30))
    
    # Get Supabase client
    supabase = get_supabase_client()
    
    # Get producer performance metrics
    producer_performance = await _calculate_producer_performance(
        supabase, start_date, end_date, filters
    )
    
    # Get shipping method performance metrics
    shipping_method_performance = await _calculate_shipping_method_performance(
        supabase, start_date, end_date, filters
    )
    
    # Calculate overall performance metrics
    overall_performance = await _calculate_overall_performance(
        supabase, start_date, end_date, filters
    )
    
    # Identify top performing producers
    top_performing_producers = await _identify_top_performers(
        producer_performance, limit=5
    )
    
    # Identify areas for improvement
    areas_for_improvement = await _identify_improvement_areas(
        producer_performance, shipping_method_performance
    )
    
    # Create and return the report
    return FulfillmentPerformanceReport(
        id=uuid4(),
        generated_at=now,
        period_start=start_date,
        period_end=end_date,
        filters=filters,
        producer_performance=producer_performance,
        shipping_method_performance=shipping_method_performance,
        overall_performance=overall_performance,
        top_performing_producers=top_performing_producers,
        areas_for_improvement=areas_for_improvement
    )


async def generate_exception_report(filters: FulfillmentReportFilters) -> FulfillmentExceptionReport:
    """
    Generate a report on fulfillment exceptions and issues.
    
    Args:
        filters: Report filters including date range, producer, and other criteria
        
    Returns:
        FulfillmentExceptionReport: Report on fulfillment exceptions
    """
    # Set default date range if not provided
    now = datetime.now()
    end_date = filters.end_date or now
    start_date = filters.start_date or (end_date - timedelta(days=30))
    
    # Get Supabase client
    supabase = get_supabase_client()
    
    # Get exception data
    total_exceptions, exception_types = await _get_exception_data(
        supabase, start_date, end_date, filters
    )
    
    # Get order-specific exception details
    order_exceptions = await _get_order_exceptions(
        supabase, start_date, end_date, filters
    )
    
    # Get resolution metrics
    resolution_metrics = await _calculate_resolution_metrics(
        supabase, start_date, end_date, filters
    )
    
    # Get producer-specific exception data
    producer_exceptions = await _get_producer_exceptions(
        supabase, start_date, end_date, filters
    )
    
    # Create and return the report
    return FulfillmentExceptionReport(
        id=uuid4(),
        generated_at=now,
        period_start=start_date,
        period_end=end_date,
        filters=filters,
        total_exceptions=total_exceptions,
        exception_types=exception_types,
        order_exceptions=order_exceptions,
        resolution_metrics=resolution_metrics,
        producer_exceptions=producer_exceptions
    )


async def export_report(report_id: UUID, format: str, include_charts: bool) -> Tuple[bytes, str]:
    """
    Export a report in the specified format.
    
    Args:
        report_id: UUID of the report to export
        format: Format to export to ('json', 'csv', 'pdf', 'excel')
        include_charts: Whether to include charts in the export
        
    Returns:
        Tuple[bytes, str]: The exported report data and the content type
    """
    # Get Supabase client
    supabase = get_supabase_client()
    
    # Fetch the report from the database
    report_response = supabase.table("fulfillment_reports").select("*").eq("id", str(report_id)).execute()
    
    if report_response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching report: {report_response.error.message}"
        )
    
    if not report_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID '{report_id}' not found"
        )
    
    report_data = report_response.data[0]
    
    # Handle different export formats
    if format.lower() == 'json':
        content = json.dumps(report_data, default=str).encode('utf-8')
        content_type = 'application/json'
    elif format.lower() == 'csv':
        content = _convert_report_to_csv(report_data)
        content_type = 'text/csv'
    elif format.lower() == 'pdf':
        # For MVP, return a not implemented error
        # In a later phase, PDF generation would be implemented here
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=f"PDF export is not implemented in the current version"
        )
    elif format.lower() == 'excel':
        # For MVP, return a not implemented error
        # In a later phase, Excel export would be implemented here
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=f"Excel export is not implemented in the current version"
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported export format: {format}"
        )
    
    return content, content_type


async def schedule_report(
    report_type: str,
    frequency: str,
    recipients: List[Dict[str, Any]],
    filters: FulfillmentReportFilters,
    format: str = "json"
) -> Dict[str, Any]:
    """
    Schedule a report for regular generation and distribution.
    
    Args:
        report_type: Type of report to generate ('metrics', 'performance', 'exceptions')
        frequency: How often to generate ('daily', 'weekly', 'monthly')
        recipients: List of recipients to receive the report
        filters: Filters to apply to the report
        format: Format to generate the report in
        
    Returns:
        Dict: Schedule information
    """
    # Validate inputs
    if report_type not in ['metrics', 'performance', 'exceptions']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid report type: {report_type}"
        )
    
    if frequency not in ['daily', 'weekly', 'monthly']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid frequency: {frequency}"
        )
    
    # Calculate next generation time
    now = datetime.now()
    if frequency == 'daily':
        next_gen = now + timedelta(days=1)
        next_gen = next_gen.replace(hour=6, minute=0, second=0, microsecond=0)
    elif frequency == 'weekly':
        # Schedule for next Monday
        days_ahead = 0 - now.weekday() + 7
        next_gen = now + timedelta(days=days_ahead)
        next_gen = next_gen.replace(hour=6, minute=0, second=0, microsecond=0)
    elif frequency == 'monthly':
        # Schedule for first of next month
        next_gen = now + relativedelta(months=1, day=1, hour=6, minute=0, second=0, microsecond=0)
    
    # Create schedule record
    schedule = {
        "id": str(uuid4()),
        "report_type": report_type,
        "frequency": frequency,
        "recipients": recipients,
        "filters": filters.dict(),
        "format": format,
        "active": True,
        "next_generation": next_gen.isoformat(),
        "created_at": now.isoformat()
    }
    
    # Get Supabase client
    supabase = get_supabase_client()
    
    # Store in database
    schedule_response = supabase.table("report_schedules").insert(schedule).execute()
    
    if schedule_response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating report schedule: {schedule_response.error.message}"
        )
    
    return schedule


# Helper functions for report calculations

async def _calculate_time_metrics(
    supabase, start_date, end_date, 
    previous_start_date, previous_end_date, 
    filters: FulfillmentReportFilters
) -> FulfillmentTimeMetrics:
    """Calculate time-based fulfillment metrics"""
    # For MVP, return simulated data with realistic values
    # In production, these would be calculated from actual database queries
    
    # Calculate average fulfillment time (from order confirmation to completion)
    avg_fulfillment_time = FulfillmentMetric(
        name="Average Fulfillment Time",
        value=36.5,
        unit="hours",
        previous_value=39.2 if previous_start_date else None,
        change_percentage=-6.9 if previous_start_date else None,
        trend="up" if previous_start_date else None
    )
    
    # Calculate average processing time (from order confirmation to picked status)
    avg_processing_time = FulfillmentMetric(
        name="Average Processing Time",
        value=8.2,
        unit="hours",
        previous_value=9.1 if previous_start_date else None,
        change_percentage=-9.9 if previous_start_date else None,
        trend="up" if previous_start_date else None
    )
    
    # Calculate average shipping time (from shipping to delivery)
    avg_shipping_time = FulfillmentMetric(
        name="Average Shipping Time",
        value=28.3,
        unit="hours",
        previous_value=30.1 if previous_start_date else None,
        change_percentage=-6.0 if previous_start_date else None,
        trend="up" if previous_start_date else None
    )
    
    # Calculate on-time fulfillment metrics
    orders_fulfilled_on_time = FulfillmentMetric(
        name="Orders Fulfilled On Time",
        value=92.5,
        unit="percent",
        previous_value=89.3 if previous_start_date else None,
        change_percentage=3.2 if previous_start_date else None,
        trend="up" if previous_start_date else None
    )
    
    orders_fulfilled_late = FulfillmentMetric(
        name="Orders Fulfilled Late",
        value=7.5,
        unit="percent",
        previous_value=10.7 if previous_start_date else None,
        change_percentage=-29.9 if previous_start_date else None,
        trend="up" if previous_start_date else None
    )
    
    return FulfillmentTimeMetrics(
        avg_fulfillment_time=avg_fulfillment_time,
        avg_processing_time=avg_processing_time,
        avg_shipping_time=avg_shipping_time,
        orders_fulfilled_on_time=orders_fulfilled_on_time,
        orders_fulfilled_late=orders_fulfilled_late
    )


async def _calculate_accuracy_metrics(
    supabase, start_date, end_date, 
    previous_start_date, previous_end_date, 
    filters: FulfillmentReportFilters
) -> FulfillmentAccuracyMetrics:
    """Calculate accuracy-based fulfillment metrics"""
    # For MVP, return simulated data with realistic values
    # In production, these would be calculated from actual database queries
    
    # Calculate order accuracy rate
    order_accuracy_rate = FulfillmentMetric(
        name="Order Accuracy Rate",
        value=98.2,
        unit="percent",
        previous_value=97.5 if previous_start_date else None,
        change_percentage=0.7 if previous_start_date else None,
        trend="up" if previous_start_date else None
    )
    
    # Calculate error rate
    error_rate = FulfillmentMetric(
        name="Error Rate",
        value=1.8,
        unit="percent",
        previous_value=2.5 if previous_start_date else None,
        change_percentage=-28.0 if previous_start_date else None,
        trend="up" if previous_start_date else None
    )
    
    # Calculate error types
    error_types = {
        "wrong_item": FulfillmentMetric(
            name="Wrong Item Shipped",
            value=0.8,
            unit="percent",
            previous_value=1.1 if previous_start_date else None,
            change_percentage=-27.3 if previous_start_date else None,
            trend="up" if previous_start_date else None
        ),
        "missing_item": FulfillmentMetric(
            name="Missing Item",
            value=0.6,
            unit="percent",
            previous_value=0.9 if previous_start_date else None,
            change_percentage=-33.3 if previous_start_date else None,
            trend="up" if previous_start_date else None
        ),
        "damaged_item": FulfillmentMetric(
            name="Damaged Item",
            value=0.4,
            unit="percent",
            previous_value=0.5 if previous_start_date else None,
            change_percentage=-20.0 if previous_start_date else None,
            trend="up" if previous_start_date else None
        )
    }
    
    # Calculate returns rate
    returns_rate = FulfillmentMetric(
        name="Returns Rate",
        value=2.3,
        unit="percent",
        previous_value=2.8 if previous_start_date else None,
        change_percentage=-17.9 if previous_start_date else None,
        trend="up" if previous_start_date else None
    )
    
    return FulfillmentAccuracyMetrics(
        order_accuracy_rate=order_accuracy_rate,
        error_rate=error_rate,
        error_types=error_types,
        returns_rate=returns_rate
    )


async def _calculate_cost_metrics(
    supabase, start_date, end_date, 
    previous_start_date, previous_end_date, 
    filters: FulfillmentReportFilters
) -> FulfillmentCostMetrics:
    """Calculate cost-based fulfillment metrics"""
    # For MVP, return simulated data with realistic values
    # In production, these would be calculated from actual database queries
    
    # Calculate average shipping cost
    avg_shipping_cost = FulfillmentMetric(
        name="Average Shipping Cost",
        value=85.50,
        unit="SEK",
        previous_value=89.25 if previous_start_date else None,
        change_percentage=-4.2 if previous_start_date else None,
        trend="up" if previous_start_date else None
    )
    
    # Calculate total shipping cost
    total_shipping_cost = FulfillmentMetric(
        name="Total Shipping Cost",
        value=42750.00,
        unit="SEK",
        previous_value=40162.50 if previous_start_date else None,
        change_percentage=6.4 if previous_start_date else None,
        trend="down" if previous_start_date else None
    )
    
    # Calculate shipping cost by method
    shipping_cost_by_method = {
        "standard": FulfillmentMetric(
            name="Standard Shipping Cost",
            value=49.00,
            unit="SEK",
            previous_value=49.00 if previous_start_date else None,
            change_percentage=0.0 if previous_start_date else None,
            trend="unchanged" if previous_start_date else None
        ),
        "express": FulfillmentMetric(
            name="Express Shipping Cost",
            value=99.00,
            unit="SEK",
            previous_value=99.00 if previous_start_date else None,
            change_percentage=0.0 if previous_start_date else None,
            trend="unchanged" if previous_start_date else None
        ),
        "pickup": FulfillmentMetric(
            name="Pickup Cost",
            value=0.00,
            unit="SEK",
            previous_value=0.00 if previous_start_date else None,
            change_percentage=0.0 if previous_start_date else None,
            trend="unchanged" if previous_start_date else None
        )
    }
    
    # Calculate fulfillment cost per order
    fulfillment_cost_per_order = FulfillmentMetric(
        name="Fulfillment Cost Per Order",
        value=105.80,
        unit="SEK",
        previous_value=110.25 if previous_start_date else None,
        change_percentage=-4.0 if previous_start_date else None,
        trend="up" if previous_start_date else None
    )
    
    return FulfillmentCostMetrics(
        avg_shipping_cost=avg_shipping_cost,
        total_shipping_cost=total_shipping_cost,
        shipping_cost_by_method=shipping_cost_by_method,
        fulfillment_cost_per_order=fulfillment_cost_per_order
    )


async def _calculate_volume_metrics(
    supabase, start_date, end_date, 
    previous_start_date, previous_end_date, 
    filters: FulfillmentReportFilters
) -> FulfillmentVolumeMetrics:
    """Calculate volume-based fulfillment metrics"""
    # For MVP, return simulated data with realistic values
    # In production, these would be calculated from actual database queries
    
    # Calculate total orders fulfilled
    total_orders_fulfilled = FulfillmentMetric(
        name="Total Orders Fulfilled",
        value=500,
        unit="orders",
        previous_value=450 if previous_start_date else None,
        change_percentage=11.1 if previous_start_date else None,
        trend="up" if previous_start_date else None
    )
    
    # Calculate orders by status
    orders_by_status = {
        "pending": FulfillmentMetric(
            name="Pending Orders",
            value=75,
            unit="orders",
            previous_value=80 if previous_start_date else None,
            change_percentage=-6.3 if previous_start_date else None,
            trend="up" if previous_start_date else None
        ),
        "processing": FulfillmentMetric(
            name="Processing Orders",
            value=50,
            unit="orders",
            previous_value=60 if previous_start_date else None,
            change_percentage=-16.7 if previous_start_date else None,
            trend="up" if previous_start_date else None
        ),
        "shipped": FulfillmentMetric(
            name="Shipped Orders",
            value=125,
            unit="orders",
            previous_value=110 if previous_start_date else None,
            change_percentage=13.6 if previous_start_date else None,
            trend="up" if previous_start_date else None
        ),
        "completed": FulfillmentMetric(
            name="Completed Orders",
            value=250,
            unit="orders",
            previous_value=200 if previous_start_date else None,
            change_percentage=25.0 if previous_start_date else None,
            trend="up" if previous_start_date else None
        )
    }
    
    # Calculate orders by shipping method
    orders_by_shipping_method = {
        "standard": FulfillmentMetric(
            name="Standard Shipping",
            value=300,
            unit="orders",
            previous_value=280 if previous_start_date else None,
            change_percentage=7.1 if previous_start_date else None,
            trend="up" if previous_start_date else None
        ),
        "express": FulfillmentMetric(
            name="Express Shipping",
            value=150,
            unit="orders",
            previous_value=130 if previous_start_date else None,
            change_percentage=15.4 if previous_start_date else None,
            trend="up" if previous_start_date else None
        ),
        "pickup": FulfillmentMetric(
            name="Pickup",
            value=50,
            unit="orders",
            previous_value=40 if previous_start_date else None,
            change_percentage=25.0 if previous_start_date else None,
            trend="up" if previous_start_date else None
        )
    }
    
    # Calculate average items per order
    avg_items_per_order = FulfillmentMetric(
        name="Average Items Per Order",
        value=4.2,
        unit="items",
        previous_value=3.8 if previous_start_date else None,
        change_percentage=10.5 if previous_start_date else None,
        trend="up" if previous_start_date else None
    )
    
    return FulfillmentVolumeMetrics(
        total_orders_fulfilled=total_orders_fulfilled,
        orders_by_status=orders_by_status,
        orders_by_shipping_method=orders_by_shipping_method,
        avg_items_per_order=avg_items_per_order
    )


async def _calculate_producer_performance(
    supabase, start_date, end_date, filters: FulfillmentReportFilters
) -> Dict[UUID, Dict[str, FulfillmentMetric]]:
    """Calculate performance metrics for each producer"""
    # For MVP, return simulated data for a few producers
    # In production, these would be calculated from actual database queries
    
    producer_performance = {
        UUID("123e4567-e89b-12d3-a456-426614174000"): {
            "order_accuracy": FulfillmentMetric(
                name="Order Accuracy Rate",
                value=99.1,
                unit="percent",
                trend=None
            ),
            "avg_processing_time": FulfillmentMetric(
                name="Average Processing Time",
                value=6.8,
                unit="hours",
                trend=None
            ),
            "on_time_rate": FulfillmentMetric(
                name="On-Time Fulfillment Rate",
                value=94.5,
                unit="percent",
                trend=None
            )
        },
        UUID("223e4567-e89b-12d3-a456-426614174001"): {
            "order_accuracy": FulfillmentMetric(
                name="Order Accuracy Rate",
                value=97.2,
                unit="percent",
                trend=None
            ),
            "avg_processing_time": FulfillmentMetric(
                name="Average Processing Time",
                value=9.4,
                unit="hours",
                trend=None
            ),
            "on_time_rate": FulfillmentMetric(
                name="On-Time Fulfillment Rate",
                value=91.2,
                unit="percent",
                trend=None
            )
        }
    }
    
    return producer_performance


async def _calculate_shipping_method_performance(
    supabase, start_date, end_date, filters: FulfillmentReportFilters
) -> Dict[str, Dict[str, FulfillmentMetric]]:
    """Calculate performance metrics for each shipping method"""
    # For MVP, return simulated data for the shipping methods
    
    shipping_method_performance = {
        "standard": {
            "on_time_rate": FulfillmentMetric(
                name="On-Time Delivery Rate",
                value=93.2,
                unit="percent",
                trend=None
            ),
            "cost_efficiency": FulfillmentMetric(
                name="Cost per Order",
                value=49.00,
                unit="SEK",
                trend=None
            )
        },
        "express": {
            "on_time_rate": FulfillmentMetric(
                name="On-Time Delivery Rate",
                value=97.5,
                unit="percent",
                trend=None
            ),
            "cost_efficiency": FulfillmentMetric(
                name="Cost per Order",
                value=99.00,
                unit="SEK",
                trend=None
            )
        },
        "pickup": {
            "on_time_rate": FulfillmentMetric(
                name="On-Time Pickup Rate",
                value=98.3,
                unit="percent",
                trend=None
            ),
            "cost_efficiency": FulfillmentMetric(
                name="Cost per Order",
                value=0.00,
                unit="SEK",
                trend=None
            )
        }
    }
    
    return shipping_method_performance


async def _calculate_overall_performance(
    supabase, start_date, end_date, filters: FulfillmentReportFilters
) -> Dict[str, FulfillmentMetric]:
    """Calculate overall fulfillment performance metrics"""
    # For MVP, return simulated data
    
    overall_performance = {
        "fulfillment_efficiency": FulfillmentMetric(
            name="Fulfillment Efficiency",
            value=92.3,
            unit="percent",
            trend=None
        ),
        "cost_efficiency": FulfillmentMetric(
            name="Cost Efficiency",
            value=105.80,
            unit="SEK/order",
            trend=None
        ),
        "customer_satisfaction": FulfillmentMetric(
            name="Customer Satisfaction",
            value=4.7,
            unit="score",
            trend=None
        )
    }
    
    return overall_performance


async def _identify_top_performers(
    producer_performance: Dict[UUID, Dict[str, FulfillmentMetric]], limit: int = 5
) -> List[Dict[str, Any]]:
    """Identify top performing producers"""
    # For MVP, return simulated data
    
    top_performers = [
        {
            "producer_id": UUID("123e4567-e89b-12d3-a456-426614174000"),
            "producer_name": "Organic Farms Inc.",
            "performance_score": 96.5,
            "strengths": ["Order accuracy", "Processing speed"],
            "order_volume": 185
        },
        {
            "producer_id": UUID("323e4567-e89b-12d3-a456-426614174002"),
            "producer_name": "Fresh Greens Co.",
            "performance_score": 94.2,
            "strengths": ["On-time fulfillment", "Order accuracy"],
            "order_volume": 120
        }
    ]
    
    return top_performers


async def _identify_improvement_areas(
    producer_performance: Dict[UUID, Dict[str, FulfillmentMetric]],
    shipping_method_performance: Dict[str, Dict[str, FulfillmentMetric]]
) -> List[Dict[str, Any]]:
    """Identify areas that need improvement"""
    # For MVP, return simulated data
    
    improvement_areas = [
        {
            "area": "Processing time for Producer 2",
            "current_value": 9.4,
            "unit": "hours",
            "target": 7.0,
            "impact": "high",
            "recommendation": "Work with producer to optimize picking process and provide additional training."
        },
        {
            "area": "Standard shipping on-time rate",
            "current_value": 93.2,
            "unit": "percent",
            "target": 95.0,
            "impact": "medium",
            "recommendation": "Evaluate current carrier performance and consider alternative options for problem routes."
        }
    ]
    
    return improvement_areas


async def _get_exception_data(
    supabase, start_date, end_date, filters: FulfillmentReportFilters
) -> Tuple[int, Dict[str, FulfillmentMetric]]:
    """Get data on fulfillment exceptions"""
    # For MVP, return simulated data
    
    # Total exceptions
    total_exceptions = 42
    
    # Exception types
    exception_types = {
        "out_of_stock": FulfillmentMetric(
            name="Out of Stock",
            value=18,
            unit="exceptions",
            details={"percentage": 42.9}
        ),
        "shipping_delay": FulfillmentMetric(
            name="Shipping Delay",
            value=12,
            unit="exceptions",
            details={"percentage": 28.6}
        ),
        "address_issue": FulfillmentMetric(
            name="Address Issue",
            value=8,
            unit="exceptions",
            details={"percentage": 19.0}
        ),
        "order_damage": FulfillmentMetric(
            name="Order Damage",
            value=4,
            unit="exceptions",
            details={"percentage": 9.5}
        )
    }
    
    return total_exceptions, exception_types


async def _get_order_exceptions(
    supabase, start_date, end_date, filters: FulfillmentReportFilters
) -> List[Dict[str, Any]]:
    """Get detailed order exception data"""
    # For MVP, return simulated data
    
    order_exceptions = [
        {
            "order_id": UUID("423e4567-e89b-12d3-a456-426614174003"),
            "exception_type": "out_of_stock",
            "date": datetime.now() - timedelta(days=2),
            "producer_id": UUID("223e4567-e89b-12d3-a456-426614174001"),
            "resolved": True,
            "resolution_time": 4.5,  # hours
        },
        {
            "order_id": UUID("523e4567-e89b-12d3-a456-426614174004"),
            "exception_type": "shipping_delay",
            "date": datetime.now() - timedelta(days=5),
            "producer_id": UUID("123e4567-e89b-12d3-a456-426614174000"),
            "resolved": True,
            "resolution_time": 24.0,  # hours
        },
        {
            "order_id": UUID("623e4567-e89b-12d3-a456-426614174005"),
            "exception_type": "address_issue",
            "date": datetime.now() - timedelta(days=1),
            "producer_id": UUID("323e4567-e89b-12d3-a456-426614174002"),
            "resolved": False,
            "resolution_time": None,
        }
    ]
    
    return order_exceptions


async def _calculate_resolution_metrics(
    supabase, start_date, end_date, filters: FulfillmentReportFilters
) -> Dict[str, FulfillmentMetric]:
    """Calculate metrics on exception resolution"""
    # For MVP, return simulated data
    
    resolution_metrics = {
        "avg_resolution_time": FulfillmentMetric(
            name="Average Resolution Time",
            value=12.8,
            unit="hours",
            trend=None
        ),
        "resolution_rate": FulfillmentMetric(
            name="Resolution Rate",
            value=85.7,
            unit="percent",
            trend=None
        ),
        "customer_resolution_satisfaction": FulfillmentMetric(
            name="Customer Resolution Satisfaction",
            value=4.1,
            unit="score",
            trend=None
        )
    }
    
    return resolution_metrics


async def _get_producer_exceptions(
    supabase, start_date, end_date, filters: FulfillmentReportFilters
) -> Dict[UUID, Dict[str, Any]]:
    """Get exception data by producer"""
    # For MVP, return simulated data
    
    producer_exceptions = {
        UUID("123e4567-e89b-12d3-a456-426614174000"): {
            "total_exceptions": 12,
            "common_issues": ["shipping_delay", "out_of_stock"],
            "resolution_rate": 91.7,
            "avg_resolution_time": 10.2
        },
        UUID("223e4567-e89b-12d3-a456-426614174001"): {
            "total_exceptions": 18,
            "common_issues": ["out_of_stock", "order_damage"],
            "resolution_rate": 83.3,
            "avg_resolution_time": 15.6
        },
        UUID("323e4567-e89b-12d3-a456-426614174002"): {
            "total_exceptions": 8,
            "common_issues": ["address_issue"],
            "resolution_rate": 75.0,
            "avg_resolution_time": 8.9
        }
    }
    
    return producer_exceptions


def _convert_report_to_csv(report_data: Dict) -> bytes:
    """Convert report data to CSV format"""
    # This is a simplified implementation that works with the MVP structure
    # In production, this would need to handle more complex nested structures
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header row
    writer.writerow(["Report ID", str(report_data.get("id"))])
    writer.writerow(["Generated At", str(report_data.get("generated_at"))])
    writer.writerow(["Period", f"{report_data.get('period_start')} to {report_data.get('period_end')}"]) 
    writer.writerow([])  # Empty row as separator
    
    # Write metrics sections
    if "time_metrics" in report_data:
        writer.writerow(["Time Metrics"])
        writer.writerow(["Metric", "Value", "Unit", "Change %", "Trend"])
        
        for metric_name, metric in report_data["time_metrics"].items():
            if isinstance(metric, dict):
                writer.writerow([
                    metric.get("name", metric_name),
                    metric.get("value", ""),
                    metric.get("unit", ""),
                    metric.get("change_percentage", ""),
                    metric.get("trend", "")
                ])
        
        writer.writerow([])  # Empty row as separator
    
    # Similar handling for other sections...
    # Simplified for MVP
    
    return output.getvalue().encode('utf-8') 