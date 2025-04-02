<script setup lang="ts">
import { AgGridVue } from 'ag-grid-vue3';
import type { PlId, Qc } from '@platforma-open/milaboratories.mixcr-clonotyping.model';
import type { PlAgHeaderComponentParams } from '@platforma-sdk/ui-vue';
import {
  PlBlockPage,
  PlBtnGhost,
  PlMaskIcon24,
  PlSlideModal,
  PlAgTextAndButtonCell,
  PlAgCellStatusTag,
} from '@platforma-sdk/ui-vue';
import { refDebounced, whenever } from '@vueuse/core';
import { reactive, watch } from 'vue';
import { useApp } from './app';
import type { MiXCRResult } from './results';
import { MiXCRResultsFull } from './results';
import SampleReportPanel from './SampleReportPanel.vue';
import SettingsPanel from './SettingsPanel.vue';
import { getAlignmentChartSettings } from './charts/alignmentChartSettings';
import { getChainsChartSettings } from './charts/chainsChartSettings';
import { PlAgChartStackedBarCell, useAgGridOptions } from '@platforma-sdk/ui-vue';
import { parseProgressString } from './parseProgress';

const app = useApp();

const result = refDebounced(MiXCRResultsFull, 100, {
  maxWait: 200,
});

const data = reactive<{
  settingsOpen: boolean;
  sampleReportOpen: boolean;
  selectedSample: PlId | undefined;
}>({
  settingsOpen: app.model.outputs.started === false,
  sampleReportOpen: false,
  selectedSample: undefined,
});

watch(
  () => app.model.outputs.started,
  (newVal, oldVal) => {
    if (oldVal === false && newVal === true) data.settingsOpen = false;
    if (oldVal === true && newVal === false) data.settingsOpen = true;
  },
);

whenever(
  () => data.settingsOpen,
  () => (data.sampleReportOpen = false),
);
whenever(
  () => data.sampleReportOpen,
  () => (data.settingsOpen = false),
);

const qcPriority = { OK: 0, WARN: 1, ALERT: 2 };

const { gridOptions } = useAgGridOptions<MiXCRResult>(({ builder }) => {
  return builder
    .options({
      getRowId: (row) => row.data.sampleId,
      onRowDoubleClicked: (e) => {
        data.selectedSample = e.data?.sampleId;
        data.sampleReportOpen = data.selectedSample !== undefined;
      },
      components: {
        PlAgTextAndButtonCell,
      },
    })
    .setRowData(result.value)
    .columnRowNumbers(true)
    .setDefaultColDef({
      suppressHeaderMenuButton: true,
      lockPinned: true,
      sortable: false,
    })
    .column<string>({
      colId: 'label',
      field: 'label',
      headerName: 'Sample',
      headerComponentParams: { type: 'Text' },
      pinned: 'left',
      lockPinned: true,
      sortable: true,
      textWithButton: true,
    })
    .column<string>({
      colId: 'progress',
      field: 'progress',
      headerName: 'Progress',
      headerComponentParams: { type: 'Progress' } satisfies PlAgHeaderComponentParams,
      progress(cellData) {
        const parsed = parseProgressString(cellData);

        if (parsed.stage === 'Queued') {
          return {
            status: 'not_started',
            text: parsed.stage,
          };
        }

        return {
          status: parsed.stage === 'Done' ? 'done' : 'running',
          percent: parsed.percentage,
          text: parsed.stage,
          suffix: parsed.etaLabel ?? '',
        };
      },
    })
    // NOTE: special columns for PlAgCellStatusTag, PlAgChartStackedBarCell, PlAgTextAndButtonCell in next version
    .column<MiXCRResult['qc']>({
      colId: 'qc',
      field: 'qc',
      width: 96,
      cellRendererSelector: (cellData) => {
        const type = (cellData.data?.qc)?.reduce(
          (result: Qc[number]['status'], item) =>
            qcPriority[item.status] > qcPriority[result] ? item.status : result,
          'OK',
        );
        return {
          component: PlAgCellStatusTag,
          params: { type },
        };
      },
      headerName: 'Quality',
      headerComponentParams: { type: 'Text' },
      noGutters: true, // this means "no padding" i. e. --ag-cell-horizontal-padding: 0px & --ag-cell-vertical-padding: 0px
    })
    .column<string>({
      colId: 'alignmentStats',
      headerName: 'Alignments',
      headerComponentParams: { type: 'Text' },
      flex: 1,
      cellStyle: {
        '--ag-cell-horizontal-padding': '12px',
      },
      cellRendererSelector: (cellData) => {
        const value = getAlignmentChartSettings(cellData.data?.alignReport);
        return {
          component: PlAgChartStackedBarCell,
          params: { value },
        };
      },
    })
    .column<string>({
      colId: 'chainsStats',
      headerName: 'Chains',
      headerComponentParams: { type: 'Text' },
      flex: 1,
      cellStyle: {
        '--ag-cell-horizontal-padding': '12px',
      },
      cellRendererSelector: (cellData) => {
        const value = getChainsChartSettings(cellData.data?.alignReport);
        return {
          component: PlAgChartStackedBarCell,
          params: { value },
        };
      },
    });
});
</script>

<template>
  <PlBlockPage>
    <template #title>MiXCR Clonotyping</template>
    <template #append>
      <PlBtnGhost @click.stop="() => (data.settingsOpen = true)">
        Settings
        <template #append>
          <PlMaskIcon24 name="settings" />
        </template>
      </PlBtnGhost>
    </template>
    <div :style="{ flex: 1 }">
      <AgGridVue
        :style="{ height: '100%' }"
        v-bind="gridOptions"
      />
    </div>
  </PlBlockPage>
  <PlSlideModal
    v-model="data.settingsOpen"
    :shadow="true"
    :close-on-outside-click="app.model.outputs.started"
  >
    <template #title>Settings</template>
    <SettingsPanel />
  </PlSlideModal>
  <PlSlideModal
    v-model="data.sampleReportOpen"
    :close-on-outside-click="app.model.outputs.started"
    width="80%"
  >
    <template #title>
      Results for
      {{
        (data.selectedSample ? app.model.outputs.sampleLabels?.[data.selectedSample] : undefined) ??
          '...'
      }}
    </template>
    <SampleReportPanel v-model="data.selectedSample" />
  </PlSlideModal>
</template>
