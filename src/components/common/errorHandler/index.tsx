import React, { useEffect } from "react";
import { Env } from "../../../common/environment";
import { strings } from "../../../common/strings";
import {
  AppError,
  ErrorCode,
  IAppError,
} from "../../../models/applicationState";
import Alert from "../alert";

export interface IErrorHandlerProps {
  error?: IAppError;
  onError: (error: IAppError) => void;
  onClearError: () => void;
}

export const ErrorHandler: React.FC<IErrorHandlerProps> = (props) => {
  const onWindowError = (evt: ErrorEvent) => {
    handleError(evt.error);
    evt.preventDefault();
  };

  const onUnhandedRejection = (evt: PromiseRejectionEvent) => {
    handleError(evt.reason);
    evt.preventDefault();
  };

  const handleError = (error: string | Error | AppError) => {
    if (!error) {
      return;
    }

    if (isReactDnDError(error)) {
      return;
    }

    let appError: IAppError;
    if (typeof error === "string") {
      appError = {
        errorCode: ErrorCode.Unknown,
        message: error || getUnknownErrorMessage(error),
      };
    } else if (error instanceof AppError) {
      const reason = error as IAppError;
      appError = {
        title: reason.title || strings.errors.unknown.title,
        errorCode: reason.errorCode,
        message: reason.message || getUnknownErrorMessage(error),
      };
    } else if (error instanceof Error) {
      const reason = error as Error;
      appError = {
        title: reason.name || strings.errors.unknown.title,
        errorCode: ErrorCode.Unknown,
        message: reason.message || getUnknownErrorMessage(error),
      };
    } else {
      appError = {
        title: strings.errors.unknown.title,
        errorCode: ErrorCode.Unknown,
        message: getUnknownErrorMessage(error),
      };
    }

    props.onError(appError);
  };

  const getUnknownErrorMessage = (e: string | Error | AppError) => {
    if (Env.get() !== "production") {
      return JSON.stringify(e, null, 2);
    } else {
      return strings.errors.unknown.message;
    }
  };

  const getLocalizedError = (appError: IAppError): IAppError => {
    if (appError.errorCode === ErrorCode.Unknown) {
      return appError;
    }
    const localizedError = strings.errors[appError.errorCode];
    if (!localizedError) {
      return appError;
    }
    return {
      errorCode: appError.errorCode,
      message: localizedError.message,
      title: localizedError.title,
    };
  };

  const isReactDnDError = (e: string | Error | AppError) => {
    if (e instanceof AppError) {
      return (
        e &&
        e.name === "Invariant Violation" &&
        e.message === "Expected to find a valid target."
      );
    } else {
      return false;
    }
  };

  useEffect(() => {
    window.removeEventListener("error", onWindowError);
    window.removeEventListener("unhandledrejection", onUnhandedRejection);
    window.addEventListener("error", onWindowError, true);
    window.addEventListener("unhandledrejection", onUnhandedRejection, true);
  }, []);

  const showError = !!props.error;
  let localizedError: IAppError | null = null;
  if (showError && props.error) {
    localizedError = getLocalizedError(props.error);
  }

  return (
    <Alert
      title={localizedError ? localizedError.title || "" : ""}
      message={localizedError ? localizedError.message : ""}
      closeButtonColor="secondary"
      show={showError}
      onClose={props.onClearError}
    />
  );
};
