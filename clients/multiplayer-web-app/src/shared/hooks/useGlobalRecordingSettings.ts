import { useCallback, useEffect, useRef, useState } from "react";
import useMessage from "shared/hooks/useMessage";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  getRemoteSessionRecordingSettings,
  updateConditionalRecordingSettings,
} from "shared/services/radar.service";
import * as yup from "yup";
import {
  RemoteRecordingConditionSettings,
  RemoteRecordingStopCondition,
} from "shared/models/interfaces";

export type GeneralFormValues = {
  enabled: boolean;
  samplingRate: number;
  maxRecordingSessionsEnabled: boolean;
  maxRemoteSessionRecordings?: number | null;
  recordingOptions: {
    frontend: {
      screens: boolean;
      traces: boolean;
      logs: boolean;
      logLevel: string;
      content: boolean;
    };
    backend: {
      traces: boolean;
      logs: boolean;
      logLevel: string;
      content: boolean;
    };
  };
  startConditions: {
    startOnError: boolean;
  };
  stopConditions: RemoteRecordingStopCondition;
};

const mapFormToSettings = (
  data: GeneralFormValues
): RemoteRecordingConditionSettings => {
  return {
    enabled: data.enabled,
    samplingRate: data.samplingRate / 100,
    startConditions: {
      startOnError: data.startConditions.startOnError,
    },
    stopConditions: {
      idleTime: data.stopConditions.idleTime * 1000,
      maxTime: data.stopConditions.maxTime * 60000,
    },
    recordingOptions: {
      frontend: {
        content: data.recordingOptions.frontend.content,
        logs: data.recordingOptions.frontend.logs,
        traces: data.recordingOptions.frontend.traces,
        screens: data.recordingOptions.frontend.screens,
        ...(data.recordingOptions.frontend.logs && {
          logLevel: data.recordingOptions.frontend.logLevel,
        }),
      },
      backend: {
        content: data.recordingOptions.backend.content,
        logs: data.recordingOptions.backend.logs,
        traces: data.recordingOptions.backend.traces,
        ...(data.recordingOptions.backend.logs && {
          logLevel: data.recordingOptions.backend.logLevel,
        }),
      },
    },
    ...(data.maxRecordingSessionsEnabled && {
      maxRemoteSessionRecordings: data.maxRemoteSessionRecordings,
    }),
  };
};

const mapSettingsToForm = (
  settings: RemoteRecordingConditionSettings,
  defaults: GeneralFormValues
): GeneralFormValues => {
  const base = { ...defaults };

  let formValues: GeneralFormValues = base;

  if (settings) {
    formValues = {
      ...base,
      enabled: settings.enabled ?? base.enabled,
      samplingRate:
        settings.samplingRate != null
          ? Math.round(settings.samplingRate * 100)
          : base.samplingRate,

      maxRecordingSessionsEnabled: !!settings.maxRemoteSessionRecordings,

      maxRemoteSessionRecordings:
        settings.maxRemoteSessionRecordings ?? base.maxRemoteSessionRecordings,

      recordingOptions: {
        frontend: {
          screens:
            settings.recordingOptions?.frontend?.screens ??
            base.recordingOptions.frontend.screens,
          traces:
            settings.recordingOptions?.frontend?.traces ??
            base.recordingOptions.frontend.traces,
          logs:
            settings.recordingOptions?.frontend?.logs ??
            base.recordingOptions.frontend.logs,
          logLevel:
            settings.recordingOptions?.frontend?.logLevel ??
            base.recordingOptions.frontend.logLevel,
          content:
            settings.recordingOptions?.frontend?.content ??
            base.recordingOptions.frontend.content,
        },
        backend: {
          traces:
            settings.recordingOptions?.backend?.traces ??
            base.recordingOptions.backend.traces,
          logs:
            settings.recordingOptions?.backend?.logs ??
            base.recordingOptions.backend.logs,
          logLevel:
            settings.recordingOptions?.backend?.logLevel ??
            base.recordingOptions.backend.logLevel,
          content:
            settings.recordingOptions?.backend?.content ??
            base.recordingOptions.backend.content,
        },
      },

      startConditions: {
        startOnError:
          settings.startConditions?.startOnError ??
          base.startConditions.startOnError,
      },

      stopConditions: {
        idleTime: settings.stopConditions?.idleTime
          ? parseFloat((settings.stopConditions.idleTime / 1000).toFixed(1))
          : base.stopConditions.idleTime,
        maxTime: settings.stopConditions?.maxTime
          ? parseFloat((settings.stopConditions.maxTime / 60000).toFixed(1))
          : base.stopConditions.maxTime,
      },
    };
  }

  return formValues;
};

const generalSettingsSchema = yup
  .object({
    enabled: yup.boolean().required(),

    samplingRate: yup
      .number()
      .min(0, "Sampling rate must be at least 0%")
      .max(100, "Sampling rate cannot exceed 100%")
      .required("Sampling rate is required"),

    maxRecordingSessionsEnabled: yup.boolean().required(),
    maxRemoteSessionRecordings: yup
      .number()
      .nullable()
      .when("maxRecordingSessionsEnabled", {
        is: true,
        then: (schema) =>
          schema
            .min(1, "Minimum value is 1")
            .required("Max recording sessions is required when enabled"),
        otherwise: (schema) => schema.optional(),
      }),

    recordingOptions: yup.object({
      frontend: yup.object({
        screens: yup.boolean().required(),
        traces: yup.boolean().required(),
        logs: yup.boolean().required(),
        logLevel: yup.string().when("logs", {
          is: true,
          then: (schema) => schema.required("logLevel is required"),
          otherwise: (schema) => schema.notRequired(),
        }),
        content: yup.boolean().required(),
      }),
      backend: yup.object({
        traces: yup.boolean().required(),
        logs: yup.boolean().required(),
        logLevel: yup.string().when("logs", {
          is: true,
          then: (schema) => schema.required("logLevel is required"),
          otherwise: (schema) => schema.notRequired(),
        }),
        content: yup.boolean().required(),
      }),
    }),

    startConditions: yup.object({
      startOnError: yup.boolean().required(),
    }),

    stopConditions: yup.object({
      idleTime: yup
        .number()
        .typeError("Idle time must be a number")
        .min(0, "Must be ≥ 0")
        .required(),
      maxTime: yup
        .number()
        .typeError("Max time must be a number")
        .min(0, "Must be ≥ 0")
        .required(),
    }),
  })
  .required();

export const useGlobalRecordingSettings = (
  workspaceId: string,
  projectId: string,
  isOpen?: boolean
) => {
  const message = useMessage();
  const [isLoading, setIsLoading] = useState(false);

  const generalDefaultsRef = useRef<GeneralFormValues>({
    enabled: true,
    samplingRate: 0,
    maxRecordingSessionsEnabled: false,
    maxRemoteSessionRecordings: 1,

    recordingOptions: {
      frontend: {
        screens: false,
        traces: false,
        logs: false,
        logLevel: "info",
        content: false,
      },
      backend: {
        traces: false,
        logs: false,
        logLevel: "info",
        content: false,
      },
    },

    startConditions: {
      startOnError: false,
    },

    stopConditions: {
      idleTime: 60,
      maxTime: 3,
    },
  });

  const generalSettingsForm = useForm<GeneralFormValues>({
    resolver: yupResolver(generalSettingsSchema),
    defaultValues: generalDefaultsRef.current,
  });

  const getGeneralSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const generalSettings = await getRemoteSessionRecordingSettings(
        workspaceId,
        projectId
      );

      if (generalSettings) {
        const formValues = mapSettingsToForm(
          generalSettings,
          generalDefaultsRef.current
        );
        generalSettingsForm.reset(formValues);
        generalDefaultsRef.current = formValues;
      }
    } catch (err) {
      message.handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, projectId, message, generalSettingsForm]);

  useEffect(() => {
    if (!isOpen) return;
    getGeneralSettings();
  }, [getGeneralSettings, isOpen]);

  const onGeneralSettingsSubmit = generalSettingsForm.handleSubmit(
    async (data) => {
      try {
        const settingsPayload = mapFormToSettings(data);

        await updateConditionalRecordingSettings(
          workspaceId,
          projectId,
          settingsPayload
        );
        generalSettingsForm.reset(data);
        message.success("Saved successfully!");
      } catch (err) {
        message.handleError(err);
      }
    }
  );

  return {
    form: generalSettingsForm,
    isLoading,
    onSubmit: onGeneralSettingsSubmit,
    defaults: generalDefaultsRef.current,
    reset: () => generalSettingsForm.reset(),
  };
};
