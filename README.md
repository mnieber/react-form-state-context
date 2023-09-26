# react-form-state-context

The react-form-state-context library is a React hooks based solution for processing forms. The main idea is that the form state is stored in a single object which is made available to all the elements in the form via a React context.

```
<FormStateProvider
  initialValues={getInitialValues()}
  initialErrors={getInitialErrors()}
  handleValidate={myHandleValidate}
  handleSubmit={myHandleSubmit}
  handleCancel={myHandleCancel}
>
  <NameField>
  <NameFieldError>
  <AddressField>
  <AddressFieldError>
  <SubmitButton>
</FormStateProvider>
```

The form components obtain access to the form state using `const formState = useFormStateContext();`.
They can use `formState` as follows:

- `formState.getValue(<field name>)` is called to get a current form value.
- `formState.setValue(<field name>, <field value>)` is called to update a form value.
- `formState.getError(<field name>)` is used to get the current error for a form field.
- `formState.validate()` is called to validate all form fields (see the explanation of `handleValidate` below).
- `formState.submit()` is called to submit the form contents (see the explanation of `handleSubmit` below).
- `formState.cancel()` is called to cancel the form (see the explanation of `handleCancel` below).
- `formState.reset(initialValues, initialErrors)` resets the form.

## Important note: the form values and errors are mutable

When you call `formState.setValue('myField', 'myNewValue')` then this does two things:

- It changes the form (immediately). If you call `formState.getValue('myField')` right after then it will return `myNewValue`.
- It triggers a re-render of all components that use the related `FormStateContext`.

The same is true when calling `formState.setError` and `formState.getError`.

## Field names

The `formState` functions will only allow field-names that were listed in the `initialValues` property. Use `null` to initialize values for which you don't have (or don't want to use) a regular initial value.

## Form resets

If you change the `initialValues` or `initialErrors` property value then `formState.reset` is called automatically. The JSON.stringify function is used to determine if the values or errors have changed, so ensure that the `initialValues` or `initialErrors` are stringify-able (if they are not, then you may be able to fix this by adding a `toJSON` function to these objects).

## Validation

The `handleValidate` function is executed when you call `formState.validate()`. In `handleValidate` you can set form field errors, as shown in the example code below:

```
const handleValidate = ({ values, getValue, setError }) => {
  if (!getValue("name")) {
    setError("name", "Please enter your name");
  }
};
```

You don't need to clear previous errors in `handleValidate` because `formState.validate()` takes care of this. Note that it's usually not necessary to call `formState.validate()` in your code because `formState.submit()` calls it automatically.

## Submitting

The `handleSubmit` function is executed when you call `formState.submit()`. It takes the object with all form values as its argument. An example handleSubmit function is:

```
const handleSubmit = (values) => {
  // do something with the form contents...
  console.log(values.name);
};
```

When you call `formState.submit()` this will first call `formState.validate()` and only execute the `handleSubmit` function if there are no form errors.

## Dirty and pristine fields

This library provides no api for finding out which form fields have been touched. However, for fields that were initialized
to `null` (using the `initialValues` property) this is easy to find out, as long as the form components do not assign
`null` to form values.

## The createFormFieldProps() function

This is a helper function that connects an `<input>` element with a form state. An example usage is:

```
const addressInputProps = createFormFieldProps({
  formState: formState,
  fieldName: 'address',
  fieldType: 'text',
  onChange: myOnChange,
  controlled: false,
});

const addressInput = <input {...addressInputProps}/>

```

The output of `createFormFieldProps` is a set of properties that is passed to the <input> element.
In the given example:

- the `name` property of the <input> element will be 'address'
- the `defaultValue` property of the <input> element will be `formState.getValue('address')`
- the `onChange` property of the <input> element will be connected to `myOnChange`
- the form field will not be controlled
