import { useCallback, useEffect, useRef, useState } from "react";
import useMessage from "shared/hooks/useMessage";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  createRemoteSessionRecordingConditions,
  listRemoteSessionRecordingConditions,
  updateRemoteSessionRecordingConditions,
  removeRemoteSessionRecordingConditions,
} from "shared/services/radar.service";
import * as yup from "yup";
import {
  RemoteSessionRecordingConditionCompareOperator,
  SessionRecordingMode,
} from "@multiplayer/types";
import {
  RemoteRecordingStartCondition,
  RemoteRecordingStopCondition,
  RemoteSessionRecordingSettings,
} from "shared/models/interfaces";
import { RemoteRecordingResourceAttributes } from "shared/models/enums";

export type FiltersFormValues = {
  _id?: string;
  name: string;
  description: string;
  enabled: boolean;
  samplingRate: number;
  mode: SessionRecordingMode;
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
  conditions: {
    start: RemoteRecordingStartCondition[];
    stop: RemoteRecordingStopCondition;
  };
};

const mapFormToFilters = (
  data: FiltersFormValues
): RemoteSessionRecordingSettings => {
  return {
    enabled: data.enabled,
    name: data.name,
    description: data.description,
    samplingRate: data.samplingRate / 100,
    mode: data.mode,
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
    conditions: {
      start: data.conditions.start.map((condition) => {
        const { attributePath, attributeRoot, value, conditionType } =
          condition;
        return {
          attributePath: `${attributeRoot}.${attributePath}`,
          ...(value !== "" && { value }),
          conditionType,
        };
      }),
      stop: {
        idleTime: data.conditions.stop.idleTime * 1000,
        maxTime: data.conditions.stop.maxTime * 60000,
      },
    },
  };
};

const mapFiltersToForm = (
  remoteFilters: RemoteSessionRecordingSettings[],
  defaults: FiltersFormValues
): FiltersFormValues[] => {
  const base = { ...defaults };

  let formValues: FiltersFormValues[] = [];

  remoteFilters?.forEach((filter: RemoteSessionRecordingSettings) => {
    const startConditions =
      filter.conditions?.start?.map((c: RemoteRecordingStartCondition) => {
        const isResource = c.attributePath?.includes("resource");
        const isUser = c.attributePath?.includes("user");
        const root = isResource
          ? RemoteRecordingResourceAttributes.RESOURCE_ATTRIBUTES
          : isUser
          ? RemoteRecordingResourceAttributes.USER_ATTRIBUTES
          : RemoteRecordingResourceAttributes.SESSION_ATTRIBUTES;

        const prefix = `${root}.`;
        const sliced = c.attributePath?.startsWith(prefix)
          ? c.attributePath.slice(prefix.length)
          : c.attributePath;

        return {
          attributeRoot: root,
          attributePath: sliced ?? "",
          value: c.value ?? "",
          conditionType:
            c.conditionType ??
            RemoteSessionRecordingConditionCompareOperator.EQUALS,
        };
      }) ?? base.conditions.start;

    formValues.push({
      ...base,
      _id: (filter as any)._id,
      name: filter.name ?? base.name,
      description: filter.description ?? base.description,

      enabled: filter.enabled ?? base.enabled,

      samplingRate:
        filter.samplingRate != null
          ? Math.round(filter.samplingRate * 100)
          : base.samplingRate,

      mode: filter.mode ?? base.mode,

      recordingOptions: {
        frontend: {
          screens:
            filter.recordingOptions?.frontend?.screens ??
            base.recordingOptions.frontend.screens,
          traces:
            filter.recordingOptions?.frontend?.traces ??
            base.recordingOptions.frontend.traces,
          logs:
            filter.recordingOptions?.frontend?.logs ??
            base.recordingOptions.frontend.logs,
          logLevel:
            filter.recordingOptions?.frontend?.logLevel ??
            base.recordingOptions.frontend.logLevel,
          content:
            filter.recordingOptions?.frontend?.content ??
            base.recordingOptions.frontend.content,
        },
        backend: {
          traces:
            filter.recordingOptions?.backend?.traces ??
            base.recordingOptions.backend.traces,
          logs:
            filter.recordingOptions?.backend?.logs ??
            base.recordingOptions.backend.logs,
          logLevel:
            filter.recordingOptions?.backend?.logLevel ??
            base.recordingOptions.backend.logLevel,
          content:
            filter.recordingOptions?.backend?.content ??
            base.recordingOptions.backend.content,
        },
      },

      conditions: {
        start: startConditions,
        stop: {
          idleTime: filter.conditions?.stop?.idleTime
            ? parseFloat((filter.conditions.stop.idleTime / 1000).toFixed(1))
            : base.conditions.stop.idleTime,
          maxTime: filter.conditions?.stop?.maxTime
            ? parseFloat((filter.conditions.stop.maxTime / 60000).toFixed(1))
            : base.conditions.stop.maxTime,
        },
      },
    });
  });

  return formValues;
};

const filterSchema = yup
  .object({
    name: yup.string().trim().required("Name is required"),
    description: yup
      .string()
      .trim()
      .default("")
      .required("Description is required"),

    enabled: yup.boolean().required(),
    samplingRate: yup
      .number()
      .min(0, "Sampling rate must be at least 0%")
      .max(100, "Sampling rate cannot exceed 100%")
      .required("Sampling rate is required"),

    mode: yup
      .mixed<SessionRecordingMode>()
      .oneOf(Object.values(SessionRecordingMode) as SessionRecordingMode[])
      .required(),

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

    conditions: yup.object({
      start: yup
        .array()
        .of(
          yup.object({
            attributePath: yup.string().trim().required("Key is required"),
            value: yup
              .string()
              .trim()
              .when("conditionType", {
                is: (ct: RemoteSessionRecordingConditionCompareOperator) =>
                  ct ===
                    RemoteSessionRecordingConditionCompareOperator.EXISTS ||
                  ct ===
                    RemoteSessionRecordingConditionCompareOperator.NOT_EXISTS,
                then: (schema) => schema.notRequired(),
                otherwise: (schema) => schema.required("Value is required"),
              }),
            conditionType: yup
              .mixed<RemoteSessionRecordingConditionCompareOperator>()
              .oneOf(
                Object.values(
                  RemoteSessionRecordingConditionCompareOperator
                ) as RemoteSessionRecordingConditionCompareOperator[]
              )
              .required(),
          })
        )
        .min(1, "Add at least one condition"),

      stop: yup.object({
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
    }),
  })
  .required();

const filtersSchema = yup.object({
  filters: yup.array().of(filterSchema),
});

export const useRemoteRecordingFilters = (
  workspaceId: string,
  projectId: string,
  isOpen?: boolean
) => {
  const message = useMessage();
  const [isLoading, setIsLoading] = useState(false);

  const filtersDefaultsRef = useRef<FiltersFormValues>({
    name: "",
    description: "",
    enabled: true,
    samplingRate: 0,
    mode: SessionRecordingMode.CONTINUOUS,

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

    conditions: {
      start: [
        {
          attributePath: "",
          attributeRoot: RemoteRecordingResourceAttributes.SESSION_ATTRIBUTES,
          value: "",
          conditionType: RemoteSessionRecordingConditionCompareOperator.EQUALS,
        },
      ],
      stop: {
        idleTime: 60,
        maxTime: 3,
      },
    },
  });

  const filtersForm = useForm<{ filters: FiltersFormValues[] }>({
    resolver: yupResolver(filtersSchema),
    defaultValues: {
      filters: [],
    },
  });

  const handleAddFilter = useCallback(() => {
    const currentFilters = filtersForm.getValues("filters") || [];
    filtersForm.setValue("filters", [
      ...currentFilters,
      { ...filtersDefaultsRef.current },
    ]);
  }, [filtersForm]);

  const getFilters = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters = await listRemoteSessionRecordingConditions(
        workspaceId,
        projectId
      );

      const FiltersFormValues = mapFiltersToForm(
        filters.data || [],
        filtersDefaultsRef.current
      );
      filtersForm.reset({ filters: FiltersFormValues });
    } catch (err) {
      message.handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, projectId, message, filtersForm]);

  useEffect(() => {
    if (!isOpen) return;
    getFilters();
  }, [getFilters, isOpen]);

  const onFiltersDelete = useCallback(
    async (filterId: string) => {
      try {
        await removeRemoteSessionRecordingConditions(
          workspaceId,
          projectId,
          filterId
        );
        // Refresh filters list after deletion
        await getFilters();
      } catch (err) {
        message.handleError(err);
      }
    },
    [workspaceId, projectId, message, getFilters]
  );

  const onFiltersSubmit = (
    selectedFilterIndex: number
  ): ((e: React.FormEvent) => Promise<boolean>) => {
    return (e: React.FormEvent) => {
      return new Promise((resolve) => {
        filtersForm.handleSubmit(async ({ filters }) => {
          const selectedFilter = filters[selectedFilterIndex];
          if (!selectedFilter) {
            resolve(false);
            return;
          }

          try {
            const filtersPayload = mapFormToFilters(selectedFilter);
            const filterId = selectedFilter._id;

            if (filterId) {
              await updateRemoteSessionRecordingConditions(
                workspaceId,
                projectId,
                filterId,
                filtersPayload
              );
            } else {
              await createRemoteSessionRecordingConditions(
                workspaceId,
                projectId,
                filtersPayload
              );
            }

            filtersForm.reset({ filters });
            await getFilters();
            message.success("Saved successfully!");
            resolve(true);
          } catch (err) {
            message.handleError(err);
            resolve(false);
          }
        })(e);
      });
    };
  };

  const handleUpdateFilterEnabledState = useCallback(
    async (filterIndex: number, enabledState: boolean) => {
      try {
        const { filters } = filtersForm.getValues();
        const selectedFilter = filters[filterIndex];
        if (!selectedFilter) return;
        const filterId = selectedFilter._id;
        const filtersPayload = mapFormToFilters(selectedFilter);
        filtersPayload.enabled = enabledState;
        await updateRemoteSessionRecordingConditions(
          workspaceId,
          projectId,
          filterId,
          filtersPayload
        );
        await getFilters();
      } catch (err) {
        message.handleError(err);
      }
    },
    [workspaceId, projectId, message, filtersForm]
  );

  return {
    form: filtersForm,
    isLoading,
    onSubmit: onFiltersSubmit,
    onDelete: onFiltersDelete,
    handleAddFilter,
    defaults: filtersDefaultsRef.current,
    reset: () => filtersForm.reset(),
    handleUpdateFilterEnabledState,
  };
};
