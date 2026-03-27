# Product Brief: ConFigTree

## Problem

UiPath REFramework projects ship with an Excel configuration file (`Config.xlsx`) containing multiple sheets of key-value pairs. Developers who want to work with this config in a typed C# context must manually write boilerplate classes — a tedious, error-prone process.

## Target User

A developer or RPA architect who has a `Config.xlsx` file and wants a typed C# representation of it without writing the classes by hand.

## What It Does

A static web app (no backend, no login, no data leaving the browser) that:

1. Accepts an `.xlsx` file via upload or drag-and-drop
2. Parses the workbook client-side using SheetJS
3. Lets the user confirm or remap which sheets to include
4. Generates a C# class per sheet plus a root aggregator class
5. Displays the output with copy and download options

## Out of Scope

- Runtime config loading or deserialization logic
- Orchestrator or UiPath platform integration
- Multi-file merging
- Saving or storing files server-side

## Success Criteria

- Upload a real `Config.xlsx` → get valid, compilable C# within 3 clicks
- Works entirely offline once the page is loaded
- Output matches the conventions in ADR-003
