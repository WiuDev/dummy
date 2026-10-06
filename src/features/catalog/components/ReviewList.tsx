import { Group, List, Paper, Rating, Text, VisuallyHidden } from '@mantine/core'
import { formatDate } from '@/lib/format'
import type { Review } from '@/schemas/product'

export interface ReviewListProps {
  readonly reviews: readonly Review[]
}

// A API repete autor, e-mail e data entre avaliações; a key soma o conteúdo e
// a ocorrência, sem depender da posição na lista.
function withKeys(reviews: readonly Review[]) {
  const occurrences = new Map<string, number>()
  return reviews.map((review) => {
    const content = `${review.reviewerEmail}|${review.date}|${review.rating}|${review.comment}`
    const occurrence = (occurrences.get(content) ?? 0) + 1
    occurrences.set(content, occurrence)
    return { review, key: `${content}|${occurrence}` }
  })
}

// Avaliações de clientes como vêm da API (D43); a data sai em pt-BR.
export function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return <Text c="dimmed">Este produto ainda não tem avaliações.</Text>
  }

  return (
    <List listStyleType="none" spacing="md" aria-label="Avaliações de clientes">
      {withKeys(reviews).map(({ review, key }) => (
        <List.Item key={key}>
          <Paper withBorder radius="md" p="md">
            <Group justify="space-between" gap="xs">
              <Text fw={600}>{review.reviewerName}</Text>
              <Text
                component="time"
                dateTime={review.date}
                size="sm"
                c="dimmed"
              >
                {formatDate(review.date)}
              </Text>
            </Group>
            <Group gap={6} mt={4}>
              <Rating value={review.rating} readOnly size="sm" aria-hidden />
              <VisuallyHidden>Nota {review.rating} de 5</VisuallyHidden>
            </Group>
            <Text mt="xs">{review.comment}</Text>
          </Paper>
        </List.Item>
      ))}
    </List>
  )
}
