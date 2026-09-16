function pi-log -d "Run Pi with provider request logging enabled"
  env PI_REQUEST_LOG=1 command pi $argv
end
