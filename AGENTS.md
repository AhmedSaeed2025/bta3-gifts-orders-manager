# Project Architecture Rules

- Keep branded-invoice mobile item cards separate from the desktop/print table, and centralize print-only layout overrides in the invoice selector so phone readability does not degrade paper output.
- Route active invoice views through the shared selector with the branded template as default, so invoices keep the same logo, data, and print behavior across entry points.