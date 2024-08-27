fields_to_columns = {'-cloneId': 'cloneId',
                     '-cellGroup': 'cellGroup',
                     '-tags': 'tagValueCELL',
                     '-readCount': 'readCount',
                     '-readFraction': 'readFraction',
                     '-uniqueTagCount': 'uniqueMoleculeCount',
                     '-uniqueTagFraction': 'uniqueMoleculeFraction',
                     '-targetSequences': 'targetSequences',
                     '-targetQualities': 'targetQualities',
                     '-vHitsWithScore': 'allVHitsWithScore',
                     '-dHitsWithScore': 'allDHitsWithScore',
                     '-jHitsWithScore': 'allJHitsWithScore',
                     '-cHitsWithScore': 'allCHitsWithScore',
                     '-vAlignments': 'allVAlignments',
                     '-dAlignments': 'allDAlignments',
                     '-jAlignments': 'allJAlignments',
                     '-cAlignments': 'allCAlignments',
                     '-topChains': 'topChains',
                     '-isotype' : 'isotype'
                     }
skipped_fields = ['-allNFeaturesWithMinQuality', '-allAAFeatures', '-defaultAnchorPoints']
cols = []
preset_fields_to_columns = {''}
for field in preset['exportClone']['fields']:
    if field['field'] not in skipped_fields:
        cols.append(fields_to_columns[field['field']])
if 'assembleContigs' in preset['pipeline']:
    check if user set --assemble-contigs-by or use all seq columns
else:
    check if user set --assemble-clonotypes-by or take feature
            from preset['assemble']['cloneAssemblerParameters']['assemblingFeatures']