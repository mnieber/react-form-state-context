# Forms

This library is used for processing forms. It stores a form state in a single object which is made available to all
the elements in the form via a React context.

```
        <FormStateProvider ...>
          <NameField>
          <NameFieldError>
          <AddressField>
          <AddressFieldError>
          <SubmitButton>
        </FormStateProvider>
```

The form elements obtain access to the form state using `const formState = useFormStateContext();`. The elements can use `formState` as follows:

- `formState.getValue(<field name>)` is called to get a current form value. For example, `NameField` will call `formState.getValue('name')` to populate the name field.

- `formState.setValue(<field name>, <field value>)` is called to update a form value. For example, `NameField` will call `formState.setValue` in its `onChange` handler.

- `formState.getError(<field name>)` is used to get the current error for a form field. For example, `formState.getError('name')` is used in `NameFieldError`.

- `formState.validate()` is called to validate all form fields (see the explanation of the `handleValidate` property of `FormStateProvider` below).

- `formState.submit()` is called to submit the form contents (see the explanation of the `handleSubmit` property of `FormStateProvider` below).

- `formState.reset(initialValues, initialErrors)` resets the form.

## Details

### Field names

Field names are strings that play a central rolw when working with the form state:

- you need the field name to get or set a value in the form state.
- you need the field name to get or set an error in the form state.
- field names are used to set errors in the `handleValidate` function
- the `submit` function receives the mapping from field names to values
- field names are used to set the initial form values (see the explanation of the `initialValues` property of `FormStateProvider` below)

You need to tell the FormStateProvider about the set of known field names in its `initialValues` property. Using an unknown field name in any form state function results in an error.

### FormStateProvider

The `FormStateProvider` takes the following properties:

- `initialValues` is a dictionary that maps each field-name to a value. If there is no value yet for a field-name, then you should map that field-name to `null` (this way, `FormStateProvider` still knows that the field exists).

NOTE: if you change the value of `initialValues` or `initialErrors` (see below) then `formState.reset` is called automatically with the latest values of `initialValues` and `initialErrors`.

- the (optional) `initialErrors` property is a dictionary that maps each field-name to an error string. It is used to initialize the form errors.

- the `handleValidate` property contains a function that is executed when you call `formState.validate()`. The purpose of `handleValidate` is to set form field errors:

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
