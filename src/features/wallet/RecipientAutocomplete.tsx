import { useState } from 'react'
import { Autocomplete, CircularProgress, TextField } from '@mui/material'
import { useDebounce } from '../../hooks/useDebounce'
import { MIN_SEARCH_LENGTH, useRecipientSearch } from '../../hooks/useRecipientSearch'
import type { UserSummary } from '../../types/user'

const DEBOUNCE_MS = 300

// Module-level so their identity is stable: MUI resets the input text when these change between renders
const getOptionLabel = (option: UserSummary) => option.email
const isSameUser = (option: UserSummary, selected: UserSummary) => option.id === selected.id
const keepServerResults = (options: UserSummary[]) => options // the server already matched; don't re-filter

type Props = {
  value: UserSummary | null
  // Receives the full { id, email } — the parent needs the real userId; email is display-only
  onChange: (recipient: UserSummary | null) => void
  disabled?: boolean
}

export function RecipientAutocomplete({ value, onChange, disabled = false }: Props) {
  const [inputValue, setInputValue] = useState('')
  // What the user typed — kept separate from inputValue so selecting an option (which fills the
  // input with its email) doesn't trigger another search
  const [searchText, setSearchText] = useState('')
  const debouncedSearch = useDebounce(searchText, DEBOUNCE_MS)
  const { data, isError, isFetching } = useRecipientSearch(debouncedSearch)

  const results = data ?? []
  // MUI requires the selected value to be among the options
  const options = value && !results.some((u) => u.id === value.id) ? [value, ...results] : results

  let noOptionsText = 'No matching user found'
  if (debouncedSearch.trim().length < MIN_SEARCH_LENGTH) noOptionsText = `Type at least ${MIN_SEARCH_LENGTH} characters`
  else if (isError) noOptionsText = 'Search failed — try again'

  return (
    <Autocomplete
      // freeSolo={false}: only a selected option can become the value — typed text is never accepted
      freeSolo={false}
      disabled={disabled}
      options={options}
      value={value}
      onChange={(_event, next) => onChange(next)}
      inputValue={inputValue}
      onInputChange={(_event, next, reason) => {
        setInputValue(next)
        if (reason === 'input' || reason === 'clear') setSearchText(next)
      }}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={isSameUser}
      filterOptions={keepServerResults}
      loading={isFetching}
      noOptionsText={noOptionsText}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Recipient email"
          fullWidth
          margin="normal"
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              endAdornment: (
                <>
                  {isFetching && <CircularProgress color="inherit" size={20} />}
                  {params.slotProps.input.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  )
}
