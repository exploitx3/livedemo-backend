import assert from 'assert'
import postCustomThemeValidator from '../src/helpers/validators/stories/custom/postCustomThemeValidator.js'

function body(fontFamily) {
  return {
    isActive: true,
    stepBackgroundColor: '#1070ff',
    textColor: '#FFFFFF',
    buttonBackgroundColor: '#1070ff',
    buttonTextColor: '#FFFFFF',
    fontFamily,
    watermarkConfig: {isActive: false, text: '', url: ''}
  }
}

assert.strictEqual(postCustomThemeValidator(body('Open Sans')).error, undefined)
assert.strictEqual(postCustomThemeValidator(body('')).error, undefined)

// the font name is interpolated into the preview HTML, so anything that could break out must be rejected
assert.ok(postCustomThemeValidator(body("Inter'; } body{display:none} .x{")).error)
assert.ok(postCustomThemeValidator(body('Inter</style><script>alert(1)</script>')).error)
assert.ok(postCustomThemeValidator(body('A'.repeat(51))).error)

console.log('theme fontFamily validation OK')
