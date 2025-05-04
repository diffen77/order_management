# Check if the .env file already exists
if (-not(Test-Path -Path .\backend\.env)) {
    Write-Host "Creating .env file in backend directory..."
    
    # Copy the env.example file to .env
    Copy-Item -Path .\backend\env.example -Destination .\backend\.env
    
    # Add the Resend API key to the .env file
    Add-Content -Path .\backend\.env -Value "`n# Resend API configuration`nRESEND_API_KEY=your_resend_api_key"
    
    Write-Host "Done! .env file created successfully."
    Write-Host "Please update the Resend API key in the .env file with your actual API key."
} else {
    Write-Host ".env file already exists. Checking if Resend API key is present..."
    
    # Check if the Resend API key is already in the .env file
    $envContent = Get-Content -Path .\backend\.env
    if ($envContent -notcontains "RESEND_API_KEY=your_resend_api_key") {
        # Add the Resend API key to the .env file
        Add-Content -Path .\backend\.env -Value "`n# Resend API configuration`nRESEND_API_KEY=your_resend_api_key"
        Write-Host "Added Resend API key to existing .env file."
        Write-Host "Please update the Resend API key in the .env file with your actual API key."
    } else {
        Write-Host "Resend API key already exists in .env file."
    }
} 