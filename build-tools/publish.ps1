#### Configuration
$deleteExistingFiles = $false
$configuration  = "Debug"

$publishsettings = ".\publishsettings.targets"
$MSBuildCall = "C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools\MSBuild\Current\Bin\MSBuild.exe"
####

function Test-ConfigExists($configName){
    if(Test-Path $configName){
        $true
    }else{
        Write-Warning "Could not find config: '$($configName)"
        Write-Warning "Make a copy of '$($currentDirectory)\$($configName).example' file. "
        Write-Warning "Then remove '.example' from the file name and fill its content with your settings."
        $false
    }
}


if(-not(Test-ConfigExists $publishsettings)){
    exit
}

[xml]$targets = Get-Content -Path $publishsettings
$publishUrl = $targets.Project.PropertyGroup.publishUrl
$siteName = (Split-Path $publishUrl -NoQualifier).TrimStart("\").TrimStart("/")

Write-Host $siteName

$sxa_site = Get-Website | ? { $_.Name -eq $siteName }
$publishPath = $sxa_site.physicalPath
$currentDirectory = Get-Item .

clear

Write-Host "1. Restoring Nuget packages" -ForegroundColor "Green"
.\nuget.exe restore ..\Sitecore.XA.Styleguide.sln 

Write-Host "Building projects" -ForegroundColor "Green"

Get-ChildItem $currentDirectory.parent.FullName -Recurse -Filter "*.csproj"| %{
    $projectPath = $_.FullName.Replace($currentDirectory.FullName,".")
    Write-Host "`tBuilding project $($_.Name)" -ForegroundColor "Cyan"
    & $MSBuildCall $projectPath /p:Configuration=$configuration /p:Platform=AnyCPU /t:WebPublish /p:WebPublishMethod=FileSystem /p:DeleteExistingFiles=$deleteExistingFiles /p:publishUrl=$publishPath /v:q
}

##Write-Host "3. Deploying '$sxaReferenceConfig'" -ForegroundColor "Green"
#Copy-Item $sxaReferenceConfig "$($publishPath)\App_Config\Include"