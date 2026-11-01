import type { MessageKeys, Messages, NestedKeyOf } from "next-intl"

export type MessageKey = MessageKeys<Messages, NestedKeyOf<Messages>>

export type MessageValues = Record<string, string | number>

export type Message = { key: MessageKey; values?: MessageValues }

export const msg = (key: MessageKey, values?: MessageValues): Message => ({ key, values })
