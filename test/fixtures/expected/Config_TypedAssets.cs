using System;
using System.Data;
using System.Collections.Generic;

namespace Cpmf.Config
{
    /// <summary>Root configuration object.</summary>
    public class CodedConfig
    {
        public AssetsConfig Assets { get; set; } = new();
        public EndpointsConfig Endpoints { get; set; } = new();
        public override string ToString() =>
            $"CodedConfig {{ Assets={Assets}, Endpoints={Endpoints} }}";

        public static CodedConfig Load(Dictionary<string, DataTable> tables)
        {
            var cfg = new CodedConfig();
            if (tables.TryGetValue("Assets", out var t_Assets)) cfg.Assets = AssetsConfig.FromDataTable(t_Assets);
            if (tables.TryGetValue("Endpoints", out var t_Endpoints)) cfg.Endpoints = EndpointsConfig.FromDataTable(t_Endpoints);
            return cfg;
        }
    }

    public class AssetsConfig
    {
        /// <summary>Input queue name.</summary>
        public OrchestratorAsset<string> QueueName { get; set; } = new();
        /// <summary>Max items to process.</summary>
        public OrchestratorAsset<int> MaxItemsPerRun { get; set; } = new();
        /// <summary>Enable strict processing.</summary>
        public OrchestratorAsset<bool> StrictMode { get; set; } = new();
        /// <summary>REST API base URL.</summary>
        public OrchestratorAsset<string> ApiEndpoint { get; set; } = new();
        /// <summary>Untyped — no ValueType.</summary>
        public OrchestratorAsset<object> GenericValue { get; set; } = new();

        public static AssetsConfig FromDataTable(DataTable dt)
        {
            var cfg = new AssetsConfig();
            foreach (DataRow row in dt.Rows)
            {
                var key   = row[0]?.ToString()?.Trim();
                var value = row[1]?.ToString()?.Trim() ?? "";
                switch (key)
                {
                    case "QueueName":
                        cfg.QueueName.AssetName = row[1]?.ToString()?.Trim() ?? "";
                        cfg.QueueName.Folder    = row[2]?.ToString()?.Trim() ?? "";
                        break;
                    case "MaxItemsPerRun":
                        cfg.MaxItemsPerRun.AssetName = row[1]?.ToString()?.Trim() ?? "";
                        cfg.MaxItemsPerRun.Folder    = row[2]?.ToString()?.Trim() ?? "";
                        break;
                    case "StrictMode":
                        cfg.StrictMode.AssetName = row[1]?.ToString()?.Trim() ?? "";
                        cfg.StrictMode.Folder    = row[2]?.ToString()?.Trim() ?? "";
                        break;
                    case "ApiEndpoint":
                        cfg.ApiEndpoint.AssetName = row[1]?.ToString()?.Trim() ?? "";
                        cfg.ApiEndpoint.Folder    = row[2]?.ToString()?.Trim() ?? "";
                        break;
                    case "GenericValue":
                        cfg.GenericValue.AssetName = row[1]?.ToString()?.Trim() ?? "";
                        cfg.GenericValue.Folder    = row[2]?.ToString()?.Trim() ?? "";
                        break;
                }
            }
            return cfg;
        }

        public override string ToString() =>
            $"AssetsConfig {{ QueueName={QueueName}, MaxItemsPerRun={MaxItemsPerRun}, StrictMode={StrictMode}, ApiEndpoint={ApiEndpoint}, GenericValue={GenericValue} }}";
    }

    public class EndpointsConfig
    {
        /// <summary>REST API base URL.</summary>
        public OrchestratorAsset<object> BaseUrl { get; set; } = new();
        /// <summary>Orchestrator folder path for queue operations.</summary>
        public OrchestratorAsset<object> OrchestratorFolder { get; set; } = new();

        public static EndpointsConfig FromDataTable(DataTable dt)
        {
            var cfg = new EndpointsConfig();
            foreach (DataRow row in dt.Rows)
            {
                var key   = row[0]?.ToString()?.Trim();
                var value = row[1]?.ToString()?.Trim() ?? "";
                switch (key)
                {
                    case "BaseUrl":
                        cfg.BaseUrl.AssetName = row[1]?.ToString()?.Trim() ?? "";
                        cfg.BaseUrl.Folder    = row[2]?.ToString()?.Trim() ?? "";
                        break;
                    case "OrchestratorFolder":
                        cfg.OrchestratorFolder.AssetName = row[1]?.ToString()?.Trim() ?? "";
                        cfg.OrchestratorFolder.Folder    = row[2]?.ToString()?.Trim() ?? "";
                        break;
                }
            }
            return cfg;
        }

        public override string ToString() =>
            $"EndpointsConfig {{ BaseUrl={BaseUrl}, OrchestratorFolder={OrchestratorFolder} }}";
    }

    public class OrchestratorAsset<T>
    {
        public string AssetName { get; set; } = "";
        public string Folder { get; set; } = "";
        public T Value { get; set; }
    }
}