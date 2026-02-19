- [x] Verify that the copilot-instructions.md file in the .github directory is created.
- [x] Clarify Project Requirements
- [x] Scaffold the Project
- [x] Customize the Project
- [x] Install Required Extensions (none required)
- [x] Compile the Project
- [x] Create and Run Task
- [ ] Launch the Project (prompt user for debug mode, launch only if confirmed)
- [ ] Ensure Documentation is Complete

Progress tracking:
- After completing each step, mark it complete and add a summary.
- Read current todo list status before starting each new step.

Communication rules:
- Avoid verbose explanations or printing full command outputs.
- If a step is skipped, state that briefly.
- Keep explanations concise and focused.

Development rules:
- Use '.' as the working directory unless user specifies otherwise.
- Avoid adding media or external links unless explicitly requested.
- Use placeholders only with a note that they should be replaced.
- Ensure all generated components serve a clear purpose within the user's requested workflow.
- If a feature is assumed but not confirmed, prompt the user for clarification before including it.

Folder creation rules:
- Always use the current directory as the project root.
- Do not create a new folder unless the user explicitly requests it besides a .vscode folder for a tasks.json file.

Extension installation rules:
- Only install extensions specified by get_project_setup_info.

Project content rules:
- Avoid generating media files unless explicitly requested.
- If media assets are placeholders, note that they should be replaced with actual assets later.

Task completion rules:
- Project is successfully scaffolded and compiled without errors.
- copilot-instructions.md exists in the project.
- README.md exists and is up to date.
- User is provided with clear instructions to debug/launch the project.
