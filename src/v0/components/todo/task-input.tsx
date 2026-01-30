'use client'

import { useState, useCallback, type FormEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface TaskInputProps {
  onAddTask: (name: string) => void
}

export function TaskInput({ onAddTask }: TaskInputProps) {
  const [value, setValue] = useState('')

  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault()
    if (value.trim()) {
      onAddTask(value.trim())
      setValue('')
    }
  }, [value, onAddTask])

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add a new task..."
        className="flex-1"
        aria-label="New task name"
      />
      <Button 
        type="submit" 
        disabled={!value.trim()}
        aria-label="Add task"
      >
        <Plus className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only sm:ml-2">Add</span>
      </Button>
    </form>
  )
}
