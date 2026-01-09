/**
 * Button Component Usage Examples
 *
 * Import the Button component:
 * import Button from "@/components/ui/Button";
 */

// Example 1: Default variant (Windows 95 gray)
<Button onClick={() => console.log("Clicked!")}>
  Click Me
</Button>

// Example 2: Primary variant (Green - matches site theme)
<Button variant="primary" onClick={handleSubmit}>
  Submit
</Button>

// Example 3: Danger variant (Red - for delete/dangerous actions)
<Button variant="danger" onClick={handleDelete}>
  Delete
</Button>

// Example 4: Different sizes
<Button size="sm">Small</Button>
<Button size="md">Medium (default)</Button>
<Button size="lg">Large</Button>

// Example 5: Disabled state
<Button disabled>Can't Click</Button>

// Example 6: Submit button in form
<form onSubmit={handleSubmit}>
  <Button type="submit" variant="primary">
    Send
  </Button>
</form>

// Example 7: With custom className
<Button className="w-full" variant="primary">
  Full Width Button
</Button>

// Example 8: Multiple buttons together
<div className="flex gap-2">
  <Button variant="default">Cancel</Button>
  <Button variant="primary">Save</Button>
  <Button variant="danger">Delete</Button>
</div>

/**
 * Props Reference:
 *
 * @prop {string} variant - 'default' | 'primary' | 'danger' (default: 'default')
 * @prop {string} size - 'sm' | 'md' | 'lg' (default: 'md')
 * @prop {boolean} disabled - Disables the button (default: false)
 * @prop {function} onClick - Click event handler
 * @prop {string} type - 'button' | 'submit' | 'reset' (default: 'button')
 * @prop {string} className - Additional Tailwind classes
 * @prop {ReactNode} children - Button content (text, icons, etc.)
 */
