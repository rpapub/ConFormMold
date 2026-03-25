"""
Generate test fixture .xlsx files for ConFormMold.
Run with: uv run generate_fixtures.py
"""

import datetime
import pathlib
import openpyxl
from openpyxl.styles import Font

OUTPUT_DIR = pathlib.Path(__file__).parent

HEADER_STANDARD = ["Name", "Value", "Description"]
HEADER_ASSET    = ["Name", "Asset", "OrchestratorAssetFolder", "Description"]


def write_sheet(ws, header, rows):
    ws.append(header)
    for cell in ws[1]:
        cell.font = Font(bold=True)
    for row in rows:
        ws.append(row)


# ---------------------------------------------------------------------------
# Config_Basic.xlsx — strings and ints only, no `using System;` expected
# ---------------------------------------------------------------------------
def make_basic():
    wb = openpyxl.Workbook()

    ws_settings = wb.active
    ws_settings.title = "Settings"
    write_sheet(ws_settings, HEADER_STANDARD, [
        ["OrchestratorQueueName", "BasicQueue",      "Orchestrator queue name."],
        ["OrchestratorFolderPath", "RPA/Basic",      "Orchestrator folder path."],
        ["MaxItemsPerRun",         10,                "Max items to process per run."],
        ["RetryCount",             3,                 "Number of retries on failure."],
        ["LogPrefix",             "BASIC",            "Prefix for log messages."],
    ])

    ws_constants = wb.create_sheet("Constants")
    write_sheet(ws_constants, HEADER_STANDARD, [
        ["MaxRetryNumber",              0,     "Must be 0 when using Orchestrator queues."],
        ["MaxConsecutiveSystemExceptions", 3,  "Stop job after this many consecutive errors."],
        ["RetryNumberGetTransactionItem",  2,  "Retries for GetTransactionItem activity."],
    ])

    ws_assets = wb.create_sheet("Assets")
    write_sheet(ws_assets, HEADER_ASSET, [])  # empty — empty class expected

    wb.save(OUTPUT_DIR / "Config_Basic.xlsx")
    print("Created Config_Basic.xlsx")


# ---------------------------------------------------------------------------
# Config_Types.xlsx — all supported C# types, `using System;` expected
# ---------------------------------------------------------------------------
def make_types():
    wb = openpyxl.Workbook()

    ws_settings = wb.active
    ws_settings.title = "Settings"
    write_sheet(ws_settings, HEADER_STANDARD, [
        ["FeatureName",       "TypesDemo",                          "string"],
        ["MaxItems",          42,                                   "int"],
        ["Threshold",         3.14,                                 "double"],
        ["IsEnabled",         True,                                 "bool"],
        ["CutoffDate",        datetime.date(2025, 12, 31),          "DateOnly — date only, time is 00:00:00"],
        ["ScheduledAt",       datetime.datetime(2025, 6, 15, 9, 30),"DateTime — has time component"],
        ["DailyRunTime",      datetime.time(8, 0, 0),               "TimeOnly — time only, no date"],
    ])

    ws_constants = wb.create_sheet("Constants")
    write_sheet(ws_constants, HEADER_STANDARD, [
        ["Pi",                3.14159,                              "double — mathematical constant"],
        ["MaxRetryNumber",    0,                                    "int"],
        ["StrictMode",        False,                                "bool"],
        ["ExpiresOn",         datetime.date(2026, 1, 1),            "DateOnly"],
        ["CreatedAt",         datetime.datetime(2024, 3, 1, 12, 0), "DateTime"],
        ["WindowOpen",        datetime.time(9, 0, 0),               "TimeOnly"],
        ["WindowClose",       datetime.time(17, 30, 0),             "TimeOnly"],
    ])

    ws_assets = wb.create_sheet("Assets")
    write_sheet(ws_assets, HEADER_ASSET, [
        ["CredentialM365",    "cred_m365_types",  "Shared",  "M365 service credential."],
        ["CredentialFtp",     "cred_ftp_types",   "Shared",  "FTP server credential."],
    ])

    wb.save(OUTPUT_DIR / "Config_Types.xlsx")
    print("Created Config_Types.xlsx")


# ---------------------------------------------------------------------------
# Config_Assets.xlsx — focus on asset schema and OrchestratorAsset output
# ---------------------------------------------------------------------------
def make_assets():
    wb = openpyxl.Workbook()

    ws_settings = wb.active
    ws_settings.title = "Settings"
    write_sheet(ws_settings, HEADER_STANDARD, [
        ["Environment",  "UAT",   "Deployment environment."],
        ["LogLevel",     "Info",  "Minimum log level."],
    ])

    ws_constants = wb.create_sheet("Constants")
    write_sheet(ws_constants, HEADER_STANDARD, [
        ["MaxRetryNumber", 0, "Must be 0 when using Orchestrator queues."],
    ])

    ws_assets = wb.create_sheet("Assets")
    write_sheet(ws_assets, HEADER_ASSET, [
        ["CredentialSap",     "cred_sap_uat",       "SAP",     "SAP system credential."],
        ["CredentialM365",    "cred_m365_uat",      "Shared",  "M365 credential."],
        ["CredentialFtp",     "cred_ftp_uat",       "FTP",     "FTP server credential."],
        ["ApiKeyPayment",     "apikey_payment_uat", "API",     "Payment gateway API key."],
    ])

    wb.save(OUTPUT_DIR / "Config_Assets.xlsx")
    print("Created Config_Assets.xlsx")


# ---------------------------------------------------------------------------
# Config_MultiSheet.xlsx — 5 sheets, tests dynamic sheet detection (#18)
# ---------------------------------------------------------------------------
def make_multi_sheet():
    wb = openpyxl.Workbook()

    ws_settings = wb.active
    ws_settings.title = "Settings"
    write_sheet(ws_settings, HEADER_STANDARD, [
        ["OrchestratorQueueName", "MultiQueue", "Orchestrator queue name."],
        ["MaxItemsPerRun",        50,            "Max items per run."],
    ])

    ws_constants = wb.create_sheet("Constants")
    write_sheet(ws_constants, HEADER_STANDARD, [
        ["MaxRetryNumber", 0, "Must be 0 when using Orchestrator queues."],
    ])

    ws_assets = wb.create_sheet("Assets")
    write_sheet(ws_assets, HEADER_ASSET, [
        ["CredentialSap", "cred_sap", "SAP", "SAP credential."],
    ])

    ws_env = wb.create_sheet("Environments")
    write_sheet(ws_env, HEADER_STANDARD, [
        ["BaseUrl",     "https://uat.example.com", "API base URL."],
        ["Environment", "UAT",                     "Deployment environment."],
        ["Timeout",     30,                        "HTTP timeout in seconds."],
    ])

    ws_features = wb.create_sheet("Features")
    write_sheet(ws_features, HEADER_STANDARD, [
        ["EnableNotifications", True,  "Send email notifications on completion."],
        ["EnableDryRun",        False, "Skip writes when true."],
        ["MaxParallelJobs",     4,     "Number of parallel job slots."],
    ])

    wb.save(OUTPUT_DIR / "Config_MultiSheet.xlsx")
    print("Created Config_MultiSheet.xlsx")


# ---------------------------------------------------------------------------
# Config_CustomSheets.xlsx — no standard sheet names, tests mapper with any name
# ---------------------------------------------------------------------------
def make_custom_sheets():
    wb = openpyxl.Workbook()

    ws_db = wb.active
    ws_db.title = "Database"
    write_sheet(ws_db, HEADER_STANDARD, [
        ["ConnectionString", "Server=db;Database=app;", "ADO.NET connection string."],
        ["CommandTimeout",   30,                        "Query timeout in seconds."],
        ["MaxPoolSize",      10,                        "Connection pool size."],
    ])

    ws_smtp = wb.create_sheet("Smtp")
    write_sheet(ws_smtp, HEADER_STANDARD, [
        ["Host",        "smtp.example.com", "SMTP server hostname."],
        ["Port",        587,                "SMTP port."],
        ["UseSsl",      True,               "Enable TLS."],
        ["FromAddress", "bot@example.com",  "Sender address."],
    ])

    ws_creds = wb.create_sheet("Credentials")
    write_sheet(ws_creds, HEADER_ASSET, [
        ["SmtpCredential",   "cred_smtp",   "Shared", "SMTP login credential."],
        ["DatabasePassword", "cred_db_pwd", "DB",     "Database user password."],
    ])

    wb.save(OUTPUT_DIR / "Config_CustomSheets.xlsx")
    print("Created Config_CustomSheets.xlsx")


# ---------------------------------------------------------------------------
# Config_BadHeader.xlsx — missing/empty header rows for error handling (#21)
# ---------------------------------------------------------------------------
def make_bad_header():
    wb = openpyxl.Workbook()

    # Sheet 1: completely empty — triggers "missing or empty header row" warning
    ws_empty = wb.active
    ws_empty.title = "EmptySheet"

    # Sheet 2: blank first row — triggers "missing or empty header row" warning
    ws_noheader = wb.create_sheet("NoHeader")
    ws_noheader.append([None, None, None])
    ws_noheader.append(["SomeKey", "SomeValue", "Some description"])

    # Sheet 3: valid — should still generate correctly alongside the bad ones
    ws_settings = wb.create_sheet("Settings")
    write_sheet(ws_settings, HEADER_STANDARD, [
        ["QueueName", "TestQueue", "A valid setting."],
    ])

    wb.save(OUTPUT_DIR / "Config_BadHeader.xlsx")
    print("Created Config_BadHeader.xlsx")


# ---------------------------------------------------------------------------
# Config_Test.xlsx — richest Settings+Constants (all types), empty Assets
# Used as Data/Config.xlsx in the REFramework test fixtures (#32).
# Empty Assets sheet avoids GetRobotAsset calls in CI (no Orchestrator).
# ---------------------------------------------------------------------------
def make_config_test():
    wb = openpyxl.Workbook()

    ws_settings = wb.active
    ws_settings.title = "Settings"
    write_sheet(ws_settings, HEADER_STANDARD, [
        ["FeatureName",       "TypesDemo",                          "string"],
        ["MaxItems",          42,                                   "int"],
        ["Threshold",         3.14,                                 "double"],
        ["IsEnabled",         True,                                 "bool"],
        ["CutoffDate",        datetime.date(2025, 12, 31),          "DateOnly — date only, time is 00:00:00"],
        ["ScheduledAt",       datetime.datetime(2025, 6, 15, 9, 30),"DateTime — has time component"],
        ["DailyRunTime",      datetime.time(8, 0, 0),               "TimeOnly — time only, no date"],
    ])

    ws_constants = wb.create_sheet("Constants")
    write_sheet(ws_constants, HEADER_STANDARD, [
        ["Pi",                3.14159,                              "double — mathematical constant"],
        ["MaxRetryNumber",    0,                                    "int"],
        ["StrictMode",        False,                                "bool"],
        ["ExpiresOn",         datetime.date(2026, 1, 1),            "DateOnly"],
        ["CreatedAt",         datetime.datetime(2024, 3, 1, 12, 0), "DateTime"],
        ["WindowOpen",        datetime.time(9, 0, 0),               "TimeOnly"],
        ["WindowClose",       datetime.time(17, 30, 0),             "TimeOnly"],
    ])

    ws_assets = wb.create_sheet("Assets")
    write_sheet(ws_assets, HEADER_ASSET, [])  # empty — no GetRobotAsset calls in CI

    wb.save(OUTPUT_DIR / "Config_Test.xlsx")
    print("Created Config_Test.xlsx")


if __name__ == "__main__":
    make_basic()
    make_types()
    make_assets()
    make_multi_sheet()
    make_custom_sheets()
    make_bad_header()
    make_config_test()
    print("Done.")
