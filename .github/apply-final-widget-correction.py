from pathlib import Path

for name in ["src/main.tsx", "src/embed.tsx"]:
    path = Path(name)
    source = path.read_text()
    if 'import "./final-user-correction.css";' not in source:
        source = source.replace('import "./approved-submit-final.css";\n', 'import "./approved-submit-final.css";\nimport "./final-user-correction.css";\n')
    path.write_text(source)

test_path = Path("tests/widget-contract.test.mjs")
tests = test_path.read_text()
if 'final-user-correction\\.css' not in tests:
    tests = tests.replace('    assert.match(source, /approved-submit-final\\.css/);\n', '    assert.match(source, /approved-submit-final\\.css/);\n    assert.match(source, /final-user-correction\\.css/);\n')
    tests = tests.replace('    assert.equal((source.match(/import "\\.\\/.*\\.css";/g) ?? []).length, 3);', '    assert.equal((source.match(/import "\\.\\/.*\\.css";/g) ?? []).length, 4);')
if 'final user correction centers quick replies' not in tests:
    tests += '''\n\ntest("final user correction centers quick replies and keeps one input shape", async () => {\n  const css = await read("src/final-user-correction.css");\n  const conversation = await read("src/components/widget/AssistantConversation.tsx");\n  for (const label of ["Čo mi to ušetrí?", "Ako to funguje?", "Čo treba pripraviť?", "Pozrieť ukážky"]) {\n    assert.ok(conversation.includes(label));\n  }\n  assert.match(css, /transform:\s*scaleX\\(0\\) !important/);\n  assert.match(css, /transform-origin:\s*center !important/);\n  assert.match(css, /justify-content:\s*center !important/);\n  assert.match(css, /\.cw-inputbar,\\s*html body \.cw-widget \.cw-inputbar:focus-within/);\n  assert.match(css, /border-radius:\s*15px !important/);\n});\n\ntest("final configurator correction removes clipping icon tiles and selected stripes", async () => {\n  const css = await read("src/final-user-correction.css");\n  assert.match(css, /grid-auto-rows:\s*minmax\\(122px, auto\\) !important/);\n  assert.match(css, /max-height:\s*none !important/);\n  assert.match(css, /overflow:\s*visible !important/);\n  assert.match(css, /\.cw-rowcard__icon[\\s\\S]*background:\s*transparent !important/);\n  assert.match(css, /\.cw-selection-indicator svg[\\s\\S]*transform:\s*none !important/);\n  assert.match(css, /\.cw-next,[\\s\\S]*background:\s*#3478f6 !important/);\n  assert.doesNotMatch(css, /inset 3px 0 0|#5ee7c4|#82f4d8/);\n});\n'''
test_path.write_text(tests)
