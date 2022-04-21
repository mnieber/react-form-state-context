# react-form-state-context

The react-form-state-context library is a React hooks based solution for processing forms. The main idea is that the form state is stored in a single object which is made available to all the elements in the form via a React context.

```
        <FormStateProvider ...>
          <NameField>
          <NameFieldError>
          <AddressField>
          <AddressFieldError>
          <SubmitButton>
        </FormStateProvider>
```

The form elements obtain access to the form state using `const formState = useFormStateContext();`. This has the advantage that you do not need to pass the form state down from parent component to child component. Every form element will work with the form state that is made available by the FormStateProvider that it is nested in (where the nesting can be arbitrarily deep).

The elements can use `formState` as follows:

- `formState.getValue(<field name>)` is called to get a current form value. For example, `NameField` will call `formState.getValue('name')` to populate the name field.

- `formState.setValue(<field name>, <field value>)` is called to update a form value. For example, `NameField` will call `formState.setValue` in its `onChange` handler.

- `formState.getError(<field name>)` is used to get the current error for a form field. For example, `formState.getError('name')` is used in `NameFieldError`.

- `formState.validate()` is called to validate all form fields (see the explanation of the `handleValidate` property of `FormStateProvider` below).

- `formState.submit()` is called to submit the form contents (see the explanation of the `handleSubmit` property of `FormStateProvider` below).

- `formState.reset(initialValues, initialErrors)` resets the form.

## Important note: the form values and errors are mutable

When you call `formState.setValue('myField', 'myNewValue')` then this does two things:

- It changes the form (immediately). If you call `formState.getValue('myField')` right after then it will return `myNewValue`.
- It triggers a re-render of all components that use the related `FormStateContext`.

The same is true when calling `formState.setError` and `formState.getError`.

## Details

### Field names

Field names are a central concept for working with the form state:

- you need the field name to get or set a value in the form state.
- you need the field name to get or set an error in the form state.
- field names are used to set errors in the `handleValidate` function
- the `submit` function receives the mapping from field names to values
- field names are used to set the initial form values (see the explanation of the `initialValues` property of `FormStateProvider` below)

You need to tell the FormStateProvider about the set of known field names in its `initialValues` property. When you use an unknown field name in any form state function, an error will be printed to the console.

As a developer you have the choice between creating a React component that works with a fixed field name (e.g. the NameField component of the example will use 'name' as the field name, and the AddressField will use 'address') or creating a generic React component that has a property for the field name (e.g. you could create a <TextField fieldName='address'> component that works with the 'address' field of the form state).

### FormStateProvider

The `FormStateProvider` takes the following properties:

- `initialValues` is a dictionary that maps each field-name to a value. If there is no value yet for a field-name, then you should map that field-name to `null` (this way, `FormStateProvider` still knows that the field exists, which is important because you cannot use `formState` with any field names that were not mentioned in `initialValues`).

NOTE: if you change the value of `initialValues` or `initialErrors` (see below) then `formState.reset` is called automatically with the latest values of `initialValues` and `initialErrors`.

- the (optional) `initialErrors` property is a dictionary that maps each field-name to an error string. It is used to initialize the form errors.

- the `handleValidate` property contains a function that is executed when you call `formState.validate()`. The purpose of `handleValidate` is to set form field errors. It takes two arguments: `getValue` and `setError`, as shown in the example code below:

```
        const handleValidate = ({ values, getValue, setError }) => {
          if (!getValue("name")) {
            setError("name", "Please enter your name");
          }
        };
```

You don't need to clear previous errors in `handleValidate` because `formState.validate()` takes care of this. Note that it's usually not necessary to call `formState.validate()` because this happens automatically when `formState.submit()` is called.

- the `handleSubmit` property contains a function that is executed when you call `formState.submit()`. It takes the object with all form values as its argument. An example handleSubmit function is:

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
`null` to form values. For fields that were not initialized to `null`, I haven't found a use-case where it was still interesting
to find out if the field was dirty or pristine. If you have a use-case, please file an issue!

## The formFieldProps() function

This is a helper function that connects an `<input>` element with a form state. An example usage is:

```
        const addressInputProps = formFieldProps({
          formState: formState,
          fieldName: 'address',
        });
        const addressInput = <input {...addressInputProps}/>

```

The output of `formFieldProps` is a set of properties that is passed to the <input> element.
In the given example:

- the `name` property of the <input> element will be 'address'
- the `defaultValue` property of the <input> element will be `formState.getValue('address')`
- the `onChange` property of the <input> element will be connected to `formState.setValue('address', <new value>)`
