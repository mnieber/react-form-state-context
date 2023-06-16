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

export type HandleSubmitT = (args: HandleSubmitArgsT) => Promise<any>;

export interface HandleCancelArgsT {
  formState: FormState;
}

export type HandleCancelT = (args: HandleCancelArgsT) => void;

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
    // Because values may be an alias for formValuesRef.current,
    // make a copy first.
    const _values = { ...values };

    // Update the mutable form state
    for (const key of Object.keys(formValuesRef.current)) {
      formValuesRef.current[key] = undefined;
    }
    Object.assign(formValuesRef.current, _values);

    // Update the shadow form state to trigger a re-render.
    setState({ ...formValuesRef.current });
  };

  return [formValuesRef.current, setValues];
};

export class FormState {
  values: { [fieldName: string]: any };
  errors: { [fieldName: string]: any };
  flags: { [fieldName: string]: any };
  handleValidate: HandleValidateT | undefined;
  handleSubmit: HandleSubmitT | undefined;
  handleCancel: HandleCancelT | undefined;

  _initialValues: FormState['values'];
  _initialErrors: FormState['errors'];

  setValues: (values: FormState['values']) => void;
  setErrors: (errors: FormState['errors']) => void;
  setFlags: (flags: FormState['flags']) => void;

  constructor(
    initialValues: FormState['values'],
    initialErrors: FormState['errors'],
    handleValidate: HandleValidateT | undefined,
    handleSubmit: HandleSubmitT | undefined,
    handleCancel?: HandleCancelT | undefined,
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
    [this.flags, this.setFlags] = (createState ?? defaultCreateState)({});

    this.handleValidate = handleValidate;
    this.handleSubmit = handleSubmit;
    this.handleCancel = handleCancel;
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

  getError = (key: string) => {
    return this.errors[key];
  };

  setFlag = (key: string, flag: boolean) => {
    this.setFlags({
      ...this.flags,
      [key]: flag,
    });
  };

  getFlag = (key: string) => {
    return this.flags[key];
  };

  reset = (
    newInitialValues: FormState['values'],
    newInitialErrors: FormState['errors']
  ) => {
    this.setValues(newInitialValues);
    this.setErrors(newInitialErrors);
    this.setFlags({});
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
      this.setFlag('submitting', true);
      this.handleSubmit({
        formState: this,
        values: this.values,
      }).finally(() => this.setFlag('submitting', false));
    }
    return true;
  };

  cancel = () => {
    if (this.handleCancel) {
      this.handleCancel({
        formState: this,
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
      return Promise.resolve();
    },
    () => {
      return Promise.resolve();
    },
    () => [{}, () => {}]
  );
};

export const FormStateContext = React.createContext(getNullFormState());

const useDetectChange = (x: string) => {
  const ref = React.useRef<string | null>(null);
  if (ref.current === null) {
    ref.current = x;
  }

  const changed = x !== ref.current;
  if (changed) {
    ref.current = x;
  }
  return changed;
};

type PropsT = React.PropsWithChildren<{
  initialValues: FormState['values'];
  initialErrors?: FormState['errors'];
  handleValidate?: HandleValidateT;
  handleSubmit?: HandleSubmitT;
  handleCancel?: HandleCancelT;
  createState?: Function;
  formStateRef?: React.MutableRefObject<FormState | null>;
}>;

export const FormStateProvider: React.FC<PropsT> = ({
  initialValues,
  initialErrors,
  handleValidate,
  handleSubmit,
  handleCancel,
  createState,
  formStateRef,
  children,
}: PropsT) => {
  const getInitialErrors = () => initialErrors ?? {};

  const formState = new FormState(
    initialValues,
    getInitialErrors(),
    handleValidate,
    handleSubmit,
    handleCancel,
    createState ?? defaultCreateState
  );

  if (formStateRef) {
    formStateRef.current = formState;
  }

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
