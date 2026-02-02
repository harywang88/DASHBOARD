@echo off
echo y| "C:\Program Files\PuTTY\plink.exe" -pw sasa1212 ubuntu@144.217.13.125 "whoami && echo SSH_SUCCESS"
pause
