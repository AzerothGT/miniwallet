import { Avatar } from './Avatar.jsx'

export default {
  title: 'Identity/Avatar',
  component: Avatar,
  argTypes: {
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
    name: { control: 'text' },
  },
  args: {
    name: 'Ian Pratama',
    size: 'md',
  },
}

export const Default = {}

export const Sizes = {
  render: (args) => (
    <div className="flex items-end gap-4">
      <Avatar {...args} size="sm" />
      <Avatar {...args} size="md" />
      <Avatar {...args} size="lg" />
    </div>
  ),
}

/**
 * Colour and initials are derived from the name via a stable hash, so the same
 * person always looks the same without anything being stored.
 */
export const DeterministicColours = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {[
        'Ian Pratama',
        'Budi Santoso',
        'Citra Dewi',
        'Dewi Lestari',
        'Eko Prasetyo',
        'Fitri Handayani',
      ].map((name) => (
        <div key={name} className="w-24 text-center">
          <Avatar name={name} size="lg" />
          <p className="text-ink-muted mt-1.5 text-xs">{name}</p>
        </div>
      ))}
    </div>
  ),
}

/** Single-word names take their first two letters; a missing name shows "?". */
export const EdgeCases = {
  render: () => (
    <div className="flex items-center gap-4">
      {['Ian', 'A', '  Budi   Santoso  ', ''].map((name, index) => (
        <div key={index} className="text-center">
          <Avatar name={name} size="md" />
          <p className="text-ink-muted mt-1.5 text-xs">
            {name ? `"${name}"` : 'kosong'}
          </p>
        </div>
      ))}
    </div>
  ),
}

/** Standalone avatars need a label, since no adjacent text names the person. */
export const WithAccessibleLabel = {
  args: {
    size: 'lg',
    label: 'Ian Pratama',
  },
}
