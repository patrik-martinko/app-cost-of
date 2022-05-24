Param (
	$Version = 3
)
If ($Version -eq 2) {
	Rename-Item -Path extension\manifest.json -NewName manifest-v3.json
	Rename-Item -Path extension\manifest-v2.json -NewName manifest.json
	Compress-Archive -Path extension\* -DestinationPath ~\Downloads\extension-v2.zip
	Rename-Item -Path extension\manifest.json -NewName manifest-v2.json
	Rename-Item -Path extension\manifest-v3.json -NewName manifest.json
}
Else {
	Compress-Archive -Path extension\* -DestinationPath ~\Downloads\extension.zip
}