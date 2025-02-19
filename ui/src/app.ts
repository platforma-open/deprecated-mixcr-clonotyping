import { platforma } from '@platforma-open/milaboratories.mixcr-clonotyping.model';
import { defineApp } from '@platforma-sdk/ui-vue';
import MainPageWrapper from './MainPageWrapper.vue';

export const sdkPlugin = defineApp(platforma, (app) => {
  return {
    progress: () => {
      const qc = app.model.outputs.qc;
      const progresses = app.model.outputs.progress?.data;
      if (!progresses || !qc) return undefined;
      const done = progresses.filter((p) => p.value?.live === false);

      const result = done.length / qc.data.length;

      return result;
    },
    routes: {
      '/': () => MainPageWrapper,
    },
  };
});

export const useApp = sdkPlugin.useApp;
