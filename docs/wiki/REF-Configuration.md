<!-- REF Configuration -->
<!-- Summary: REFramework-focused article that explains configurability, the typed CodedConfig model, and how the loader treats Excel input. -->
[//]: # (REFramework Configuration)

### Configurability in REFramework

In UiPath REFramework, **configurability** means keeping process settings outside the workflow logic so they can be changed without editing the automation code.

The standard REFramework pattern stores settings in a `Config` variable with the datatype `Dictionary<String, Object>`. The dictionary is populated in `./Framework/InitAllSettings.xaml`, so most developers do not need to think about the loading step itself. In tutorials and trainings, this pattern is usually treated as the default way to work with configuration.

### Why this works

The dictionary approach is flexible and familiar.

- It centralizes settings in one place.
- It supports many different value types.
- It works well with the standard REFramework initialization flow.
- It is easy to explain in basic training material.

For small or short-lived projects, this is often enough.

### The downside of `Dictionary<String, Object>`

The main disadvantages are:

#### 1. Type safety

All values are stored as `Object`, so every read requires casting or conversion.

This means:

- type problems are discovered at runtime, not design time
- the developer must remember whether a value is a `String`, `Int32`, `Boolean`, and so on
- every usage site becomes a potential failure point

#### 2. Discoverability

The dictionary does not tell the developer which keys exist or what they mean.

This means:

- the config structure is not self-documenting
- key names must be memorized or looked up elsewhere
- new developers need conventions explained before they can use the config safely

#### 3. Maintenance

String-based keys are easy to mistype and hard to refactor.

This means:

- a renamed key can break workflows silently until execution
- missing entries are only detected when the process runs
- validation and consistency checks must be done manually

### Configurability with `CodedConfig`

How do I make a config item in `CodedConfig`?

You define it once in the class, then let the loader populate it from the `.xlsx`.

#### CodedConfig implementation

`CodedConfig` is a custom class-based config model. The developer writes the class first, then the `.xlsx` is loaded into that typed structure.

- the root config class holds the sections
- the sheet names become the section names
- each section holds typed properties
- each property has one declared datatype
- the loader reads the `.xlsx` and assigns values into those properties

That means the developer works in two places:

- in the class, where the config schema is defined
- in the `.xlsx`, where the values are maintained

This approach gives the configuration a fixed structure:

Every config setting is named and typed. Autocompletion guides you, Verify Project catches mistakes before the robot runs. No casts, no string keys, no guessing.

The config object is self-documenting:

- each setting has a real property name
- each property has a real datatype such as `string`, `int`, or `bool`
- defaults are visible directly in the class
- you can navigate every section and every setting directly in code
- refactoring is safer because there are no string keys to chase
- missing or invalid values can be handled in one place

How do I handle types from the `.xlsx`?

- **Implicit datatype handling**
  - The loader infers the type from the Excel cell itself.
  - Use this when the `.xlsx` value already makes the type obvious.
  - Example: `10` becomes `int`, `FALSE` becomes `bool`, a date cell becomes `DateOnly` or `DateTime`.

- **Explicit datatype handling**
  - Add a `DataType` column when you want to override the inferred type.
  - Use this when the Excel value needs to be treated as a specific type, even if the cell format is ambiguous.
  - Example: force `double` instead of `int`, or mark a value as `credential` / `asset`.

#### How the loader handles types

- **Implicit**
  - the cell type decides the C# type
  - `0` stays numeric
  - `False` and `FALSE` are treated as boolean values when the cell is boolean
  - text stays `string`

- **Explicit**
  - the `DataType` column decides the C# type
  - the cell value is still read, but the loader casts or converts it to the declared type
  - use this when you want one stable type contract even if the spreadsheet cell format changes

Example:

```csharp
public class SettingsConfig
{
    public string OrchestratorQueueName { get; set; } = "ProcessABCQueue";
    public int CPMForgeM365MailboxGetCount { get; set; } = 10;
    public bool CPMForgeM365IncludePaginationMetadata { get; set; } = false;
}
```

Compared with `Dictionary<String, Object>`, the typed class gives the developer:

- compile-time structure instead of loose key/value access
- better readability because the config is self-describing
- safer maintenance because renames and type changes are easier to control
- less casting and less runtime guessing when reading values

### What happens when keys change

The difference becomes clearer when the Excel file changes after the config model already exists.

- **Extra keys added to the `.xlsx`**
  - Both approaches can tolerate this if the loader ignores unknown keys.
  - The extra key itself is not the main issue.

- **A key is removed from the `.xlsx`**
  - **Dictionary**
    - The missing key becomes a runtime access problem.
    - The key is only discovered when some workflow tries to read it.
  - **CodedConfig**
    - **Class updated to match the `.xlsx`**
      - **Compile time:** the class is updated, so the code compiles against the new schema.
      - **Run time:** the removed key is no longer expected, so the typed object loads without that property.
    - **Class not updated**
      - **Compile time:** the code still compiles, because the property still exists in the class.
      - **Run time:** the loader does not find a value for that property in the `.xlsx`, so the property keeps its default value.
      - This creates a class-to-file sync mismatch that the developer must notice and fix.

- **A config value is updated in the `.xlsx`**
  - **Dictionary**
    - **Compile time:** nothing changes, because the value is still just a generic `Object`.
    - **Run time:** every workflow that reads the key sees the new value and must cast or convert it again.
  - **CodedConfig**
    - **Compile time:** the property type stays fixed in the class, so the code keeps the same contract.
    - **Run time:** the loader reads the new value once and assigns it to the typed property.
    - Every later access uses the updated typed value directly.

- **Lax datatype handling in the `.xlsx`**
  - **Dictionary**
    - Values can arrive as `0`, `False`, `FALSE`, or text that still needs conversion.
    - The developer decides how strict the handling should be at each usage site.
  - **CodedConfig**
    - The class property defines the expected datatype once.
    - The loader must parse the Excel value into that type.
    - Invalid or loosely formatted values may still need extra handling in the loader, but the intended type is fixed in the class.

This is the real tradeoff:

- `Dictionary<String, Object>` is looser and simpler to start with.
- `CodedConfig` requires the class and the `.xlsx` to stay in sync.
- In return, the config becomes explicit, stable, and easier to reason about.
