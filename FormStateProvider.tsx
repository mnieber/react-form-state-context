import React from "react";

export interface IFormState {
  values: { [fieldName: string]: any };
  initialValues: IFormState["values"];
  errors: { [fieldName: string]: string };
  initialErrors: IFormState["errors"];
  validate: () => void;
  submit: () => void;
  getValue: (fieldName: string) => any;
  setValue: (fieldName: string, value: any) => void;
  setError: (fieldName: string, error: string) => void;
  getError: (fieldName: string) => string;
  reset: (
    newInitialValues: IFormState["values"],
    newInitialErrors: IFormState["errors"]
  ) => void;
}

export interface HandleValidateArgsT {
  values: IFormState["values"];
  getValue: IFormState["getValue"];
  setError: IFormState["setError"];
}

export type HandleValidateT = ({
  values,
  getValue,
  setError,
}: HandleValidateArgsT) => void;

export interface HandleSubmitArgsT {
  values: IFormState["values"];
}

export type HandleSubmitT = ({ values }: HandleSubmitArgsT) => void;

export const defaultCreateState = (initialValues: any) => {
  return React.useState({ ...initialValues });
};

const useFormState = (
  initialValues: IFormState["values"],
  initialErrors: IFormState["errors"],
  handleValidate: HandleValidateT | undefined,
  handleSubmit: HandleSubmitT,
  createState: Function
): IFormState => {
  const [values, setValues] = createState(initialValues);
  const [errors, setErrors] = createState(initialErrors);

  const _checkKey = (key: string) => {
    if (initialValues[key] === undefined) {
      console.error(`Unknown form field ${key}`);
    }
  };

  const setValue = (key: string, value: any) => {
    _checkKey(key);
    setValues({
      ...values,
      [key]: value,
    });
  };

  const getValue = (key: string) => {
    _checkKey(key);
    return values[key];
  };

  const setError = (key: string, error: string) => {
    setErrors({
      ...errors,
      [key]: error,
    });
  };

  const reset = (
    newInitialValues: IFormState["values"],
    newInitialErrors: IFormState["errors"]
  ) => {
    setValues(newInitialValues);
    setErrors(newInitialErrors);
  };

  const getError = (key: string) => {
    return errors[key];
  };

  const validate = () => {
    const errors = {} as IFormState["errors"];
    if (handleValidate) {
      handleValidate({
        values,
        getValue,
        setError: (fieldName, error) => {
          _checkKey(fieldName);
          errors[fieldName] = error;
        },
      });
    }
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submit = () => {
    if (validate()) {
      if (!!handleSubmit) handleSubmit({ values });
    }
  };

  return {
    values,
    errors,
    validate,
    submit,
    getValue,
    setValue,
    setError,
    getError,
    reset,
    initialValues,
    initialErrors,
  };
};

const getNullFormState = (): IFormState => {
  return {
    values: {},
    initialValues: {},
    errors: {},
    initialErrors: {},
    validate: () => {},
    submit: () => {},
    getValue: (fieldName: string) => undefined,
    setValue: (fieldName: string, value: any) => {},
    setError: (fieldName: string, value: string) => {},
    getError: (fieldName: string) => "",
    reset: (
      initialValues: IFormState["values"],
      initialErrors: IFormState["errors"]
    ) => {},
  };
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
  initialValues: IFormState["values"];
  initialErrors?: IFormState["errors"];
  handleValidate?: HandleValidateT;
  handleSubmit: HandleSubmitT;
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

  const formState = useFormState(
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
