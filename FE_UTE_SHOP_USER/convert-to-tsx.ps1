# Script to convert all .jsx files to .tsx
Get-ChildItem -Recurse -Filter "*.jsx" | ForEach-Object {
    $oldPath = $_.FullName
    $newPath = $oldPath -replace '\.jsx$', '.tsx'
    
    # Read the content
    $content = Get-Content -Path $oldPath -Raw
    
    # Add basic TypeScript types if needed
    if ($content -notmatch "import.*React.*from") {
        $content = "import React from 'react';`n" + $content
    }
    
    # Write to new .tsx file
    Set-Content -Path $newPath -Value $content
    
    # Remove old .jsx file
    Remove-Item -Path $oldPath
    
    Write-Host "Converted: $($_.Name) -> $($_.Name -replace '\.jsx$', '.tsx')"
}

Write-Host "Conversion completed!"
