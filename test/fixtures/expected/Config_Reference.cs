using System;
using System.Data;
using System.Collections.Generic;

namespace Cpmf.Config
{
    /// <summary>Root configuration object.</summary>
    public class CodedConfig
    {
        public SettingsConfig Settings { get; set; } = new();
        public ConstantsConfig Constants { get; set; } = new();
        public EnvironmentsConfig Environments { get; set; } = new();
        public FeaturesConfig Features { get; set; } = new();
        public AssetsConfig Assets { get; set; } = new();
        public CredentialsConfig Credentials { get; set; } = new();
        public override string ToString() =>
            $"CodedConfig {{ Settings={Settings}, Constants={Constants}, Environments={Environments}, Features={Features}, Assets={Assets}, Credentials={Credentials} }}";

        public static CodedConfig Load(Dictionary<string, DataTable> tables)
        {
            var cfg = new CodedConfig();
            if (tables.TryGetValue("Settings", out var t_Settings)) cfg.Settings = SettingsConfig.FromDataTable(t_Settings);
            if (tables.TryGetValue("Constants", out var t_Constants)) cfg.Constants = ConstantsConfig.FromDataTable(t_Constants);
            if (tables.TryGetValue("Environments", out var t_Environments)) cfg.Environments = EnvironmentsConfig.FromDataTable(t_Environments);
            if (tables.TryGetValue("Features", out var t_Features)) cfg.Features = FeaturesConfig.FromDataTable(t_Features);
            if (tables.TryGetValue("Assets", out var t_Assets)) cfg.Assets = AssetsConfig.FromDataTable(t_Assets);
            if (tables.TryGetValue("Credentials", out var t_Credentials)) cfg.Credentials = CredentialsConfig.FromDataTable(t_Credentials);
            return cfg;
        }
    }

    public class SettingsConfig
    {
        /// <summary>string — Orchestrator input queue name.</summary>
        public string OrchestratorQueueName { get; set; } = "";
        /// <summary>int — Maximum items to process per run.</summary>
        public int MaxItemsPerRun { get; set; }
        /// <summary>double — Processing threshold.</summary>
        public double Threshold { get; set; }
        /// <summary>bool — Master feature toggle.</summary>
        public bool IsEnabled { get; set; }
        /// <summary>DateOnly — Last valid processing date.</summary>
        public DateOnly CutoffDate { get; set; }
        /// <summary>DateTime — Next scheduled run.</summary>
        public DateTime ScheduledAt { get; set; }
        /// <summary>TimeOnly — Daily start time.</summary>
        public TimeOnly DailyRunTime { get; set; }

        public static SettingsConfig FromDataTable(DataTable dt)
        {
            var cfg = new SettingsConfig();
            foreach (DataRow row in dt.Rows)
            {
                var key   = row[0]?.ToString()?.Trim();
                var value = row[1]?.ToString()?.Trim() ?? "";
                switch (key)
                {
                    case "OrchestratorQueueName": cfg.OrchestratorQueueName = value; break;
                    case "MaxItemsPerRun":
                        if (int.TryParse(value, out var v_MaxItemsPerRun)) cfg.MaxItemsPerRun = v_MaxItemsPerRun;
                        break;
                    case "Threshold":
                        if (double.TryParse(value, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var v_Threshold)) cfg.Threshold = v_Threshold;
                        break;
                    case "IsEnabled":
                        if (bool.TryParse(value, out var v_IsEnabled)) cfg.IsEnabled = v_IsEnabled;
                        break;
                    case "CutoffDate":
                        if (DateOnly.TryParse(value, out var v_CutoffDate)) cfg.CutoffDate = v_CutoffDate;
                        break;
                    case "ScheduledAt":
                        if (DateTime.TryParse(value, out var v_ScheduledAt)) cfg.ScheduledAt = v_ScheduledAt;
                        break;
                    case "DailyRunTime":
                        if (TimeOnly.TryParse(value, out var v_DailyRunTime)) cfg.DailyRunTime = v_DailyRunTime;
                        break;
                }
            }
            return cfg;
        }

        public override string ToString() =>
            $"SettingsConfig {{ OrchestratorQueueName={OrchestratorQueueName}, MaxItemsPerRun={MaxItemsPerRun}, Threshold={Threshold}, IsEnabled={IsEnabled}, CutoffDate={CutoffDate}, ScheduledAt={ScheduledAt}, DailyRunTime={DailyRunTime} }}";
    }

    public class ConstantsConfig
    {
        /// <summary>int — Must be 0 when using Orchestrator queues.</summary>
        public int MaxRetryNumber { get; set; }
        /// <summary>int — Stop job after this many consecutive errors.</summary>
        public int MaxConsecutiveSystemExceptions { get; set; }
        /// <summary>double — Mathematical constant.</summary>
        public double Pi { get; set; }
        /// <summary>bool — Disable for permissive validation.</summary>
        public bool StrictMode { get; set; }
        /// <summary>DateOnly — Config expiry date.</summary>
        public DateOnly ExpiresOn { get; set; }
        /// <summary>DateTime — Config creation timestamp.</summary>
        public DateTime CreatedAt { get; set; }
        /// <summary>TimeOnly — Processing window start.</summary>
        public TimeOnly WindowOpen { get; set; }
        /// <summary>TimeOnly — Processing window end.</summary>
        public TimeOnly WindowClose { get; set; }

        public static ConstantsConfig FromDataTable(DataTable dt)
        {
            var cfg = new ConstantsConfig();
            foreach (DataRow row in dt.Rows)
            {
                var key   = row[0]?.ToString()?.Trim();
                var value = row[1]?.ToString()?.Trim() ?? "";
                switch (key)
                {
                    case "MaxRetryNumber":
                        if (int.TryParse(value, out var v_MaxRetryNumber)) cfg.MaxRetryNumber = v_MaxRetryNumber;
                        break;
                    case "MaxConsecutiveSystemExceptions":
                        if (int.TryParse(value, out var v_MaxConsecutiveSystemExceptions)) cfg.MaxConsecutiveSystemExceptions = v_MaxConsecutiveSystemExceptions;
                        break;
                    case "Pi":
                        if (double.TryParse(value, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var v_Pi)) cfg.Pi = v_Pi;
                        break;
                    case "StrictMode":
                        if (bool.TryParse(value, out var v_StrictMode)) cfg.StrictMode = v_StrictMode;
                        break;
                    case "ExpiresOn":
                        if (DateOnly.TryParse(value, out var v_ExpiresOn)) cfg.ExpiresOn = v_ExpiresOn;
                        break;
                    case "CreatedAt":
                        if (DateTime.TryParse(value, out var v_CreatedAt)) cfg.CreatedAt = v_CreatedAt;
                        break;
                    case "WindowOpen":
                        if (TimeOnly.TryParse(value, out var v_WindowOpen)) cfg.WindowOpen = v_WindowOpen;
                        break;
                    case "WindowClose":
                        if (TimeOnly.TryParse(value, out var v_WindowClose)) cfg.WindowClose = v_WindowClose;
                        break;
                }
            }
            return cfg;
        }

        public override string ToString() =>
            $"ConstantsConfig {{ MaxRetryNumber={MaxRetryNumber}, MaxConsecutiveSystemExceptions={MaxConsecutiveSystemExceptions}, Pi={Pi}, StrictMode={StrictMode}, ExpiresOn={ExpiresOn}, CreatedAt={CreatedAt}, WindowOpen={WindowOpen}, WindowClose={WindowClose} }}";
    }

    public class EnvironmentsConfig
    {
        /// <summary>string — REST API base URL.</summary>
        public string BaseUrl { get; set; } = "";
        /// <summary>string — Deployment environment name.</summary>
        public string Environment { get; set; } = "";
        /// <summary>int — HTTP request timeout in seconds.</summary>
        public int Timeout { get; set; }
        /// <summary>double — Delay between retries in seconds.</summary>
        public double RetryDelay { get; set; }

        public static EnvironmentsConfig FromDataTable(DataTable dt)
        {
            var cfg = new EnvironmentsConfig();
            foreach (DataRow row in dt.Rows)
            {
                var key   = row[0]?.ToString()?.Trim();
                var value = row[1]?.ToString()?.Trim() ?? "";
                switch (key)
                {
                    case "BaseUrl": cfg.BaseUrl = value; break;
                    case "Environment": cfg.Environment = value; break;
                    case "Timeout":
                        if (int.TryParse(value, out var v_Timeout)) cfg.Timeout = v_Timeout;
                        break;
                    case "RetryDelay":
                        if (double.TryParse(value, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var v_RetryDelay)) cfg.RetryDelay = v_RetryDelay;
                        break;
                }
            }
            return cfg;
        }

        public override string ToString() =>
            $"EnvironmentsConfig {{ BaseUrl={BaseUrl}, Environment={Environment}, Timeout={Timeout}, RetryDelay={RetryDelay} }}";
    }

    public class FeaturesConfig
    {
        /// <summary>bool — Send email on job completion.</summary>
        public bool EnableNotifications { get; set; }
        /// <summary>bool — Skip writes when true.</summary>
        public bool EnableDryRun { get; set; }
        /// <summary>int — Parallel job slot limit.</summary>
        public int MaxParallelJobs { get; set; }
        /// <summary>string — Deployment stage label.</summary>
        public string FeatureLabel { get; set; } = "";

        public static FeaturesConfig FromDataTable(DataTable dt)
        {
            var cfg = new FeaturesConfig();
            foreach (DataRow row in dt.Rows)
            {
                var key   = row[0]?.ToString()?.Trim();
                var value = row[1]?.ToString()?.Trim() ?? "";
                switch (key)
                {
                    case "EnableNotifications":
                        if (bool.TryParse(value, out var v_EnableNotifications)) cfg.EnableNotifications = v_EnableNotifications;
                        break;
                    case "EnableDryRun":
                        if (bool.TryParse(value, out var v_EnableDryRun)) cfg.EnableDryRun = v_EnableDryRun;
                        break;
                    case "MaxParallelJobs":
                        if (int.TryParse(value, out var v_MaxParallelJobs)) cfg.MaxParallelJobs = v_MaxParallelJobs;
                        break;
                    case "FeatureLabel": cfg.FeatureLabel = value; break;
                }
            }
            return cfg;
        }

        public override string ToString() =>
            $"FeaturesConfig {{ EnableNotifications={EnableNotifications}, EnableDryRun={EnableDryRun}, MaxParallelJobs={MaxParallelJobs}, FeatureLabel={FeatureLabel} }}";
    }

    public class AssetsConfig
    {
        /// <summary>Input queue name.</summary>
        public OrchestratorAsset<string> QueueName { get; set; } = new();
        /// <summary>Upper bound for items.</summary>
        public OrchestratorAsset<int> MaxItems { get; set; } = new();
        /// <summary>Strict processing toggle.</summary>
        public OrchestratorAsset<bool> StrictFlag { get; set; } = new();
        /// <summary>REST API key.</summary>
        public OrchestratorAsset<string> ApiKey { get; set; } = new();
        /// <summary>Untyped fallback asset.</summary>
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
                    case "MaxItems":
                        cfg.MaxItems.AssetName = row[1]?.ToString()?.Trim() ?? "";
                        cfg.MaxItems.Folder    = row[2]?.ToString()?.Trim() ?? "";
                        break;
                    case "StrictFlag":
                        cfg.StrictFlag.AssetName = row[1]?.ToString()?.Trim() ?? "";
                        cfg.StrictFlag.Folder    = row[2]?.ToString()?.Trim() ?? "";
                        break;
                    case "ApiKey":
                        cfg.ApiKey.AssetName = row[1]?.ToString()?.Trim() ?? "";
                        cfg.ApiKey.Folder    = row[2]?.ToString()?.Trim() ?? "";
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
            $"AssetsConfig {{ QueueName={QueueName}, MaxItems={MaxItems}, StrictFlag={StrictFlag}, ApiKey={ApiKey}, GenericValue={GenericValue} }}";
    }

    public class CredentialsConfig
    {
        /// <summary>SAP system credential.</summary>
        public OrchestratorAsset<object> CredentialSap { get; set; } = new();
        /// <summary>Microsoft 365 credential.</summary>
        public OrchestratorAsset<object> CredentialM365 { get; set; } = new();
        /// <summary>FTP server credential.</summary>
        public OrchestratorAsset<object> CredentialFtp { get; set; } = new();

        public static CredentialsConfig FromDataTable(DataTable dt)
        {
            var cfg = new CredentialsConfig();
            foreach (DataRow row in dt.Rows)
            {
                var key   = row[0]?.ToString()?.Trim();
                var value = row[1]?.ToString()?.Trim() ?? "";
                switch (key)
                {
                    case "CredentialSap":
                        cfg.CredentialSap.AssetName = row[1]?.ToString()?.Trim() ?? "";
                        cfg.CredentialSap.Folder    = row[2]?.ToString()?.Trim() ?? "";
                        break;
                    case "CredentialM365":
                        cfg.CredentialM365.AssetName = row[1]?.ToString()?.Trim() ?? "";
                        cfg.CredentialM365.Folder    = row[2]?.ToString()?.Trim() ?? "";
                        break;
                    case "CredentialFtp":
                        cfg.CredentialFtp.AssetName = row[1]?.ToString()?.Trim() ?? "";
                        cfg.CredentialFtp.Folder    = row[2]?.ToString()?.Trim() ?? "";
                        break;
                }
            }
            return cfg;
        }

        public override string ToString() =>
            $"CredentialsConfig {{ CredentialSap={CredentialSap}, CredentialM365={CredentialM365}, CredentialFtp={CredentialFtp} }}";
    }

    public class OrchestratorAsset<T>
    {
        public string AssetName { get; set; } = "";
        public string Folder { get; set; } = "";
        public T Value { get; set; }
    }
}