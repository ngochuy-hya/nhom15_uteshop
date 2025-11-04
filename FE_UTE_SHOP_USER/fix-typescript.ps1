# Script to fix common TypeScript errors
Get-ChildItem -Recurse -Filter "*.tsx" | ForEach-Object {
    $content = Get-Content -Path $_.FullName -Raw
    
    # Remove unused React imports
    $content = $content -replace "import React from 'react';`n", ""
    $content = $content -replace "import React, \{.*\} from 'react';", "import { useState, useEffect, useContext } from 'react';"
    
    # Add React import if needed and not present
    if ($content -match "useState|useEffect|useContext" -and $content -notmatch "import.*react") {
        $content = "import React, { useState, useEffect, useContext } from 'react';`n" + $content
    }
    
    # Fix any type annotations
    $content = $content -replace "Parameter '(\w+)' implicitly has an 'any' type", "Parameter '$1: any'"
    
    # Fix component props
    $content = $content -replace "function (\w+)\((\{.*\})\)", "function $1($2): JSX.Element"
    $content = $content -replace "const (\w+) = \((\{.*\})\) =>", "const $1 = ($2): JSX.Element =>"
    
    Set-Content -Path $_.FullName -Value $content
    Write-Host "Fixed: $($_.Name)"
}

Write-Host "TypeScript fixes completed!"
