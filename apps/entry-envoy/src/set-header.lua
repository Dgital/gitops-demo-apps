function envoy_on_request(request_handle)
    local git_version = os.getenv("SERVICE_VERSION") or "unknown"
    request_handle:headers():add("x-service-version", git_version)
end