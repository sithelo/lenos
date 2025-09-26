var builder = DistributedApplication.CreateBuilder(args);

var api = builder.AddProject<Projects.aspire_lenos_Api>("api");

builder.AddNpmApp("webfrontend", "../aspire_lenos.Web")
    .WithReference(api)
    .WithHttpEndpoint(env: "API_URL");

builder.Build().Run();
