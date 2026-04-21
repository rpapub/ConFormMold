<!-- Migration (Dual Mode) -->
<!-- Summary: Guides a frictionless migration from the REFramework dictionary to CodedConfig by running both in parallel and replacing selected config items gradually. -->

The frictionless migration path is to run the old dictionary and the new typed config side by side for a while.

This keeps the change additive:

- `out_Config` stays in place for existing workflows
- `out_ConFigTree` is added as a second output of type `CodedConfig`
- both are loaded from the same source data in `./Framework/InitAllSettings.xaml`

![Dual Mode out argument](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/029_studio_flip-it-to-out-two-down_2880x1620.png)

## Why this works

You do not need a big-bang refactor.

Instead, you move only a few selected config items first:

- keep low-risk items on the dictionary for now
- move clear, stable items to `CodedConfig`
- replace them only where needed
- leave everything else untouched until later

This makes the migration incremental and easy to review.

## What changes in `InitAllSettings.xaml`

The init workflow should become additive, not replacement-driven.

That means:

- keep the existing dictionary load
- add the typed load for `CodedConfig`
- expose both results as out arguments
- do not remove the dictionary until the last consumer is gone

In practice, `InitAllSettings.xaml` becomes the bridge between the two models.

## What developers do

The migration pattern is simple:

1. Add `out_ConFigTree` beside `out_Config`.
2. Wire the typed config into `Main.xaml` and `Process.xaml`.
3. Replace a small set of config items in selected workflows.
4. Keep the rest on `out_Config` until you are ready to move them.

The most useful first candidates are values that:

- are used often
- have a clear datatype
- are unlikely to change shape
- benefit from IntelliSense and compile-time checking

## What stays the same

The source file can stay the same during the transition.

You still use the workbook as the shared source of truth.
The difference is that the workbook is now consumed in two ways:

- as a generic dictionary for legacy code
- as a typed class for migrated code

## End state

The final step is to remove `out_Config` only after the last usage has moved.

Until then, the goal is stability:

- no forced rewrite
- no large risky switch
- no breakage in untouched workflows

That is the frictionless path to `CodedConfig`.
