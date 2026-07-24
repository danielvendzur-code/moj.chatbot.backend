from pathlib import Path
import re

calculator_path = Path("src/components/widget/ToolCalculator.tsx")
calculator = calculator_path.read_text()

if "advanceTimerRef" not in calculator:
    calculator = calculator.replace(
        "  const thanksIconRef = useRef<HTMLSpanElement>(null);\n",
        "  const thanksIconRef = useRef<HTMLSpanElement>(null);\n  const advanceTimerRef = useRef<number | null>(null);\n",
    )
    calculator = calculator.replace(
        "  const restart = (nextInterest: InterestId | null) => {\n",
        "  const restart = (nextInterest: InterestId | null) => {\n    if (advanceTimerRef.current !== null) {\n      window.clearTimeout(advanceTimerRef.current);\n      advanceTimerRef.current = null;\n    }\n",
    )
    calculator = calculator.replace(
        '  useEffect(() => {\n    if (sendState === "done") drawCheck(thanksIconRef.current);\n  }, [sendState]);\n\n',
        '  useEffect(() => {\n    if (sendState === "done") drawCheck(thanksIconRef.current);\n  }, [sendState]);\n\n  useEffect(() => {\n    return () => {\n      if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current);\n    };\n  }, []);\n\n',
    )
    old_pick = '''  const pickInterest = (id: InterestId) => {\n    setInterest(id);\n    setFeatures((current) => [\n      ...current,\n      ...RECOMMENDED_FEATURES[id].filter((featureId) => !current.includes(featureId)),\n    ]);\n    track("config_interest_select", { interest: id });\n  };\n\n'''
    new_pick = '''  const scheduleAdvance = () => {\n    if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current);\n    advanceTimerRef.current = window.setTimeout(() => {\n      advanceTimerRef.current = null;\n      setStep((value) => Math.min(STEPS.length - 1, value + 1));\n    }, 120);\n  };\n\n  const pickInterest = (id: InterestId) => {\n    setInterest(id);\n    setFeatures((current) => [\n      ...current,\n      ...RECOMMENDED_FEATURES[id].filter((featureId) => !current.includes(featureId)),\n    ]);\n    track("config_interest_select", { interest: id });\n    if (id !== "custom") scheduleAdvance();\n  };\n\n  const pickIndustry = (id: string) => {\n    setIndustry(id);\n    scheduleAdvance();\n  };\n\n  const pickTimeline = (id: string) => {\n    setTimeline(id);\n    scheduleAdvance();\n  };\n\n'''
    if old_pick not in calculator:
        raise SystemExit("pickInterest block not found")
    calculator = calculator.replace(old_pick, new_pick)
    calculator = calculator.replace(
        "onClick={() => setIndustry(option.id)}",
        "onClick={() => pickIndustry(option.id)}",
    )
    calculator = calculator.replace(
        "onClick={() => setTimeline(option.id)}",
        "onClick={() => pickTimeline(option.id)}",
    )

    indicator_index = 0
    def keep_only_feature_indicator(match):
        global indicator_index
        current = indicator_index
        indicator_index += 1
        return match.group(0) if current == 2 else ""

    calculator = re.sub(
        r"\n\s*<SelectionIndicator selected=\{selected\} />",
        keep_only_feature_indicator,
        calculator,
    )
    calculator_path.write_text(calculator)

for entry in [Path("src/main.tsx"), Path("src/embed.tsx")]:
    source = entry.read_text()
    if 'import "./mobile-configurator-polish.css";' not in source:
        source = source.replace(
            'import "./final-user-correction.css";',
            'import "./final-user-correction.css";\nimport "./mobile-configurator-polish.css";',
        )
        entry.write_text(source)

tests_path = Path("tests/widget-contract.test.mjs")
tests = tests_path.read_text()
if "/mobile-configurator-polish\\.css/" not in tests:
    tests = tests.replace(
        "    assert.match(source, /final-user-correction\\.css/);\n",
        "    assert.match(source, /final-user-correction\\.css/);\n    assert.match(source, /mobile-configurator-polish\\.css/);\n",
    )
    tests = tests.replace(
        'assert.equal((source.match(/import "\\.\\/.*\\.css";/g) ?? []).length, 4);',
        'assert.equal((source.match(/import "\\.\\/.*\\.css";/g) ?? []).length, 5);',
    )
    tests += '''\n\ntest("mobile configurator uses compact cards and auto advances single choices", async () => {\n  const css = await read("src/mobile-configurator-polish.css");\n  const calculator = await read("src/components/widget/ToolCalculator.tsx");\n  const main = await read("src/main.tsx");\n  const embed = await read("src/embed.tsx");\n\n  assert.match(css, /@media \\(max-width:\\s*560px\\)/);\n  assert.match(css, /grid-auto-rows:\\s*minmax\\(92px, auto\\) !important/);\n  assert.match(css, /background:\\s*transparent !important/);\n  assert.doesNotMatch(css, /inset 3px 0 0/);\n  assert.match(calculator, /const scheduleAdvance/);\n  assert.match(calculator, /if \\(id !== "custom"\\) scheduleAdvance\\(\\)/);\n  assert.match(calculator, /onClick=\\{\\(\\) => pickIndustry\\(option.id\\)\\}/);\n  assert.match(calculator, /onClick=\\{\\(\\) => pickTimeline\\(option.id\\)\\}/);\n  assert.match(main, /mobile-configurator-polish\\.css/);\n  assert.match(embed, /mobile-configurator-polish\\.css/);\n});\n'''
    tests_path.write_text(tests)
