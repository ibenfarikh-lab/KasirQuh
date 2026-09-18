# Android foundation

The refactored project intentionally remains framework-free and uses deterministic classic-script modules. That keeps the current web deployment simple and gives a clean base for a later Capacitor wrapper.

Recommended next Android step (separate from this refactor):
1. Add Capacitor packages in a dedicated Android build workspace.
2. Set the app ID/name there without changing Firebase data paths.
3. Use the canonical `/` gateway or direct `/pelanggan/` entry depending on the APK role.
4. Add native plugins only for capabilities that the web runtime cannot provide.

This ZIP does not add an Android project yet, so the web deployment remains unchanged.
