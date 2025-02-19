<script setup lang="ts">
import { AgGridVue } from 'ag-grid-vue3';

import { ClientSideRowModelModule } from 'ag-grid-enterprise';
import type { ColDef, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-enterprise';
import { ModuleRegistry } from 'ag-grid-enterprise';
import { ProgressPattern, ProgressPrefix, type PlId, type Qc } from '@platforma-open/milaboratories.mixcr-clonotyping.model';
import {
  AgGridTheme,
  PlAgOverlayLoading,
  PlAgOverlayNoRows,
  PlBlockPage,
  PlBtnGhost,
  PlMaskIcon24,
  PlSlideModal,
  PlAgTextAndButtonCell,
  PlAgCellStatusTag,
  makeRowNumberColDef,
  autoSizeRowNumberColumn,
} from '@platforma-sdk/ui-vue';
import { refDebounced, whenever } from '@vueuse/core';
import { reactive, shallowRef, watch } from 'vue';
import { useApp } from './app';
import type { MiXCRResult } from './results';
import { MiXCRResultsFull } from './results';
import SampleReportPanel from './SampleReportPanel.vue';
import SettingsPanel from './SettingsPanel.vue';
import { getAlignmentChartSettings } from './charts/alignmentChartSettings';
import { getChainsChartSettings } from './charts/chainsChartSettings';
import { PlAgChartStackedBarCell, createAgGridColDef } from '@platforma-sdk/ui-vue';
import type { ProgressLogWithInfo } from '@platforma-sdk/model';

const app = useApp();

// @TODO
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

ModuleRegistry.registerModules([ClientSideRowModelModule]);

const qcPriority = { OK: 0, WARN: 1, ALERT: 2 };

const gridApi = shallowRef<GridApi>();
const onGridReady = (params: GridReadyEvent) => {
  gridApi.value = params.api;
  autoSizeRowNumberColumn(params.api);
};

const defaultColumnDef: ColDef = {
  suppressHeaderMenuButton: true,
  lockPinned: true,
  sortable: false,
};

const columnDefs: ColDef<MiXCRResult>[] = [
  makeRowNumberColDef(),
  {
    colId: 'label',
    field: 'label',
    headerName: 'Sample',
    pinned: 'left',
    lockPinned: true,
    sortable: true,
    cellRenderer: PlAgTextAndButtonCell,
    cellRendererParams: {
      invokeRowsOnDoubleClick: true,
    },
  },
  createAgGridColDef<MiXCRResult, ProgressLogWithInfo | undefined>({
    colId: 'progress',
    field: 'progress',
    headerName: 'Progress',

    // Progress string examples:
    // 'Final sorting: 95.2%'
    // 'Building pre-clones from tag groups: 92.9%  ETA: 00:00:00'
    // 'Initialization: progress unknown'
    // 'Applying correction & sorting alignments by UMI'
    // 'Alignment: 60.4%  ETA: 00:00:01'
    // 'Exporting clones: 11.1%'
    // 'Queued'
    // 'Done'
    //
    // @todo migrate to progress(cellValue, cellData)
    //
    progress(cellData) {
      const val = cellData.value;

      if (!val?.progressLine)
        return { status: 'not_started' };
      if (!val.live)
        return { status: 'done' };

      const progressLine = val.progressLine.replace(ProgressPrefix, '');
      const match = progressLine.match(ProgressPattern);
      if (!match) {
        return {
          status: 'running',
          text: progressLine,
        };
      }
      const { stage, progress, eta } = match.groups!;
      return {
        status: 'running',
        text: stage,
        percent: progress,
        suffix: eta ? `ETA: ${eta}` : undefined,
      };
    },
  }),
  createAgGridColDef({
    colId: 'qc',
    field: 'qc',
    width: 96,
    cellRendererSelector: (cellData) => {
      const type = (cellData.data?.qc as MiXCRResult['qc'])?.reduce(
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
    noGutters: true, // this means "no padding" i. e. --ag-cell-horizontal-padding: 0px & --ag-cell-vertical-padding: 0px
  }),
  {
    colId: 'alignmentStats',
    headerName: 'Alignments',
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
  },
  {
    colId: 'chainsStats',
    headerName: 'Chains',
    flex: 1,
    cellStyle: {
      '--ag-cell-horizontal-padding': '12px',
      // '--ag-cell-horizontal-border': 'solid rgb(150, 150, 200);',
      // 'border-width': '0'
    },
    cellRendererSelector: (cellData) => {
      const value = getChainsChartSettings(cellData.data?.alignReport);
      return {
        component: PlAgChartStackedBarCell,
        params: { value },
      };
    },
  },
];

const gridOptions: GridOptions<MiXCRResult> = {
  getRowId: (row) => row.data.sampleId,
  onRowDoubleClicked: (e) => {
    data.selectedSample = e.data?.sampleId;
    data.sampleReportOpen = data.selectedSample !== undefined;
  },
  components: {
    PlAgTextAndButtonCell,
  },
};
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
        :theme="AgGridTheme"
        :style="{ height: '100%' }"
        :rowData="result"
        :defaultColDef="defaultColumnDef"
        :columnDefs="columnDefs"
        :grid-options="gridOptions"
        :loadingOverlayComponentParams="{ notReady: true }"
        :loadingOverlayComponent="PlAgOverlayLoading"
        :noRowsOverlayComponent="PlAgOverlayNoRows"
        @grid-ready="onGridReady"
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
