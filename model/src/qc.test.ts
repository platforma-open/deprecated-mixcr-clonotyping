import { test } from 'vitest';
import { Qc } from './qc';

test('test simple qc parsing', ({ expect }) => {
  const qc: any = [
    {
      step: 'align',
      status: 'OK',
      check: {
        type: 'SuccessfullyAlignedReads',
        upper: 0.85,
        middle: 0.7,
        label: 'Successfully aligned reads'
      },
      payload: {
        printedValue: '90.0%',
        value: 0.9
      }
    },
    {
      step: 'align',
      status: 'OK',
      check: {
        type: 'OffTargetReads',
        upper: 0.2,
        middle: 0.1,
        label: 'Off target (non TCR/IG) reads'
      },
      payload: {
        printedValue: '0.0%',
        value: 0.0
      }
    },
    {
      step: 'align',
      status: 'OK',
      check: {
        type: 'ReadsWithNoVOrJHits',
        upper: 0.2,
        middle: 0.1,
        label: 'Reads with no V or J hits'
      },
      payload: {
        printedValue: '10.0%',
        value: 0.1
      }
    },
    {
      step: 'assemble',
      status: 'ALERT',
      check: {
        type: 'ReadsUsedInClonotypes',
        upper: 0.9,
        middle: 0.7,
        label: 'Reads used in clonotypes'
      },
      payload: {
        printedValue: '40.0%',
        value: 0.4
      }
    },
    {
      step: 'assemble',
      status: 'OK',
      check: {
        type: 'AlignmentsWithNoAssemblingFeature',
        upper: 0.15,
        middle: 0.05,
        label: 'Alignments without assembling feature'
      },
      payload: {
        labelOverride: 'Alignments that do not cover CDR3',
        printedValue: '0.0%',
        value: 0.0
      }
    },
    {
      step: 'assemble',
      status: 'OK',
      check: {
        type: 'AlignmentsDroppedLowQuality',
        upper: 0.05,
        middle: 0.01,
        label: 'Alignments dropped due to low sequence quality'
      },
      payload: {
        printedValue: '0.0%',
        value: 0.0
      }
    },
    {
      step: 'assemble',
      status: 'OK',
      check: {
        type: 'ClonesDroppedInPostFiltering',
        upper: 0.05,
        middle: 0.01,
        label: 'Clones dropped in post-filtering'
      },
      payload: {
        printedValue: '0.0%',
        value: 0.0
      }
    },
    {
      step: 'assemble',
      status: 'OK',
      check: {
        type: 'AlignmentsDroppedInPostFiltering',
        upper: 0.05,
        middle: 0.01,
        label: 'Alignments dropped in clones post-filtering'
      },
      payload: {
        printedValue: '0.0%',
        value: 0.0
      }
    },
    {
      step: 'align',
      status: 'ALERT',
      check: {
        type: 'OverlappedReadsMoreBetter',
        upper: 0.9,
        middle: 0.8,
        label: 'Overlapped paired-end reads'
      },
      payload: {
        printedValue: '10.0%',
        value: 0.1
      }
    }
  ];
  Qc.parse(qc);
});
