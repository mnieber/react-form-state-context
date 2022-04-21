import React from 'react';

export type ValidateOptionsT = {
  fieldNames?: string[];
};

export interface HandleValidateArgsT {
  formState: FormState;
  values: FormState['values'];
  getValue: FormState['getValue'];
  setError: FormState['setError'];
}

export type HandleValidateT = (args: HandleValidateArgsT) => void;

export interface HandleSubmitArgsT {
  formState: FormState;
  values: FormState['values'];
}

export type HandleSubmitT = (args: HandleSubmitArgsT) => void;

export const defaultCreateState = (initialValues: any) => {
  // This is the actual form state, which is mutable
  const formValuesRef = React.useRef<FormState['values']>({
    ...initialValues,
  });
  // This is a "shadow" form state that we keep up-to-date with
  // formValuesRef. Its only purpose is to trigger a re-render
  // of components that use the FormStateContext.
  const [_, setState] = React.useState<FormState['values']>({});

  const setValues = (values: FormState['values']) => {
    // Update the mutable form state
    Object.assign(formValuesRef.current, values);
    // Update the shadow form state to trigger a re-render.
    setState({ ...formValuesRef.current });
  };

  return [formValuesRef.current, setValues];
};

export class FormState {
  values: { [fieldName: string]: any };
  errors: { [fieldName: string]: any };
  handleValidate: HandleValidateT | undefined;
  handleSubmit: HandleSubmitT | undefined;

  _initialValues: FormState['values'];
  _initialErrors: FormState['errors'];

  setValues: (values: FormState['values']) => void;
  setErrors: (errors: FormState['errors']) => void;

  constructor(
    initialValues: FormState['values'],
    initialErrors: FormState['errors'],
    handleValidate: HandleValidateT | undefined,
    handleSubmit: HandleSubmitT | undefined,
    createState?: Function
  ) {
    this._initialValues = initialValues;
    this._initialErrors = initialErrors;

    [this.values, this.setValues] = (createState ?? defaultCreateState)(
      initialValues
    );
    [this.errors, this.setErrors] = (createState ?? defaultCreateState)(
      initialErrors
    );

    this.handleValidate = handleValidate;
    this.handleSubmit = handleSubmit;
  }

  _checkKey = (key: string) => {
    if (this._initialValues[key] === undefined) {
      console.error(`Unknown form field ${key}`);
    }
  };

  setValue = (key: string, value: any) => {
    this._checkKey(key);
    this.setValues({
      ...this.values,
      [key]: value,
    });
  };

  getValue = (key: string) => {
    this._checkKey(key);
    return this.values[key];
  };

  setError = (key: string, error: string | undefined) => {
    this.setErrors({
      ...this.errors,
      [key]: error,
    });
  };

  reset = (
    newInitialValues: FormState['values'],
    newInitialErrors: FormState['errors']
  ) => {
    this.setValues(newInitialValues);
    this.setErrors(newInitialErrors);
  };

  getError = (key: string) => {
    return this.errors[key];
  };

  validate = (options?: ValidateOptionsT): boolean => {
    const errors = {} as FormState['errors'];
    if (this.handleValidate) {
      this.handleValidate({
        formState: this,
        values: this.values,
        getValue: this.getValue,
        setError: (fieldName, error) => {
          this._checkKey(fieldName);
          if (
            options?.fieldNames !== undefined &&
            !options?.fieldNames.includes(fieldName)
          ) {
            return;
          }
          if (error === undefined) {
            if (fieldName in errors) {
              delete errors[fieldName];
            }
          } else {
            errors[fieldName] = error;
          }
        },
      });
    }
    this.setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  submit = () => {
    if (!this.validate()) {
      return false;
    }
    if (this.handleSubmit) {
      this.handleSubmit({
        formState: this,
        values: this.values,
      });
    }
    return true;
  };
}

const getNullFormState = (): FormState => {
  return new FormState(
    {},
    {},
    () => {
      return false;
    },
    () => {
      return false;
    },
    () => [{}, () => {}]
  );
};

export const FormStateContext = React.createContext(getNullFormState());

const useDetectChange = (x: string) => {
  const [memo, setMemo] = React.useState(x);
  const changed = x !== memo;
  if (changed) {
    setMemo(x);
  }
  return changed;
};

type PropsT = React.PropsWithChildren<{
  initialValues: FormState['values'];
  initialErrors?: FormState['errors'];
  handleValidate?: HandleValidateT;
  handleSubmit?: HandleSubmitT;
  createState?: Function;
}>;

export const FormStateProvider: React.FC<PropsT> = ({
  initialValues,
  initialErrors,
  handleValidate,
  handleSubmit,
  createState,
  children,
}: PropsT) => {
  const getInitialErrors = () => initialErrors ?? {};

  const formState = new FormState(
    initialValues,
    getInitialErrors(),
    handleValidate,
    handleSubmit,
    createState ?? defaultCreateState
  );

  if (useDetectChange(JSON.stringify(initialValues))) {
    formState.reset(initialValues, formState.errors);
  }

  if (useDetectChange(JSON.stringify(getInitialErrors()))) {
    formState.reset(formState.values, getInitialErrors());
  }

  return (
    <FormStateContext.Provider value={formState}>
      {children}
    </FormStateContext.Provider>
  );
};

export const useFormStateContext = () => {
  return React.useContext(FormStateContext);
};
