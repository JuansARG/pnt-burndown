# Readonly Field Styling — New Specification

## Purpose

Visual distinction between readonly display fields and interactive editable inputs, so users cannot mistake a calculated preview for an editable control.

## Requirements

### Requirement: Readonly Field Visual Distinction

The system MUST render readonly display fields with a visually distinct appearance that signals non-editability. Readonly fields MUST apply a muted background, no visible border, and a `default` cursor. Readonly fields MUST NOT receive focus via keyboard or mouse interaction.

#### Scenario: Readonly field appears muted

- GIVEN the sprint form is rendered with a calculated "Ends on" preview field
- WHEN the user views the form
- THEN the preview field has a muted background, no input border, and a default cursor

#### Scenario: Readonly field is not focusable

- GIVEN the sprint form is rendered
- WHEN the user tabs through interactive inputs
- THEN the readonly preview field is skipped and not focused

#### Scenario: Editable inputs remain visually distinct

- GIVEN the sprint form contains both editable inputs and a readonly preview field
- WHEN the user views the form
- THEN editable inputs have their standard border and background, clearly different from the readonly field
