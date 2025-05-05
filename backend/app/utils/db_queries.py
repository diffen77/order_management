from typing import Dict, Any, Tuple, List, Optional


def generate_update_query(
    table: str,
    update_fields: Dict[str, Any],
    where_fields: Dict[str, Any],
    returning: Optional[str] = None
) -> Tuple[str, List[Any]]:
    """
    Generate a dynamic UPDATE query.
    
    Args:
        table: Table name to update
        update_fields: Dict of field names and values to update
        where_fields: Dict of field names and values for WHERE clause
        returning: Optional string of fields to return
        
    Returns:
        Tuple containing the query string and list of parameters
    """
    if not update_fields:
        raise ValueError("No fields to update")
    
    # Build SET clause
    set_clauses = []
    params = []
    
    for idx, (field, value) in enumerate(update_fields.items(), start=1):
        set_clauses.append(f"{field} = ${idx}")
        params.append(value)
    
    # Build WHERE clause
    where_clauses = []
    
    for idx, (field, value) in enumerate(where_fields.items(), start=len(params) + 1):
        where_clauses.append(f"{field} = ${idx}")
        params.append(value)
    
    # Construct final query
    query = f"UPDATE {table} SET {', '.join(set_clauses)}"
    
    if where_clauses:
        query += f" WHERE {' AND '.join(where_clauses)}"
    
    if returning:
        query += f" RETURNING {returning}"
    
    return query, params


def generate_select_query(
    table: str,
    select_fields: str,
    where_fields: Optional[Dict[str, Any]] = None,
    order_by: Optional[str] = None,
    limit: Optional[int] = None,
    offset: Optional[int] = None
) -> Tuple[str, List[Any]]:
    """
    Generate a dynamic SELECT query.
    
    Args:
        table: Table name to select from
        select_fields: String of fields to select
        where_fields: Optional Dict of field names and values for WHERE clause
        order_by: Optional string for ORDER BY clause
        limit: Optional limit value
        offset: Optional offset value
        
    Returns:
        Tuple containing the query string and list of parameters
    """
    query = f"SELECT {select_fields} FROM {table}"
    params = []
    
    # Build WHERE clause
    if where_fields:
        where_clauses = []
        
        for idx, (field, value) in enumerate(where_fields.items(), start=1):
            where_clauses.append(f"{field} = ${idx}")
            params.append(value)
        
        if where_clauses:
            query += f" WHERE {' AND '.join(where_clauses)}"
    
    # Add ORDER BY if specified
    if order_by:
        query += f" ORDER BY {order_by}"
    
    # Add LIMIT if specified
    if limit is not None:
        param_idx = len(params) + 1
        query += f" LIMIT ${param_idx}"
        params.append(limit)
    
    # Add OFFSET if specified
    if offset is not None:
        param_idx = len(params) + 1
        query += f" OFFSET ${param_idx}"
        params.append(offset)
    
    return query, params 