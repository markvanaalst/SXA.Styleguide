Import-Module -Name SPE

$session = New-ScriptSession -Username admin -Password b -ConnectionUri https://sxa93.dev.local

Invoke-RemoteScript -Session $session -ScriptBlock { 
	# Create package
	$package= New-Package -Name "SXA Styleguide"
	
	$package.Metadata.Author = "Mark van Aalst";
	$package.Metadata.Publisher = "Sitecore Technical Marketing";
	$package.Metadata.Version = Get-Date -Format FileDateTimeUniversal;


	$configs = Get-UnicornConfiguration
	$configs | New-UnicornItemSource -Project $package
	Export-Package -Project $package -Path "C:\Projects\Sitecore.XA.Styleguide_sc93-prerelease\export\Sitecore.XA.Styleguide.zip" -Zip
}

Stop-ScriptSession -Session $session