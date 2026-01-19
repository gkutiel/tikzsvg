
import { z } from "zod"


export type Cover = z.infer<typeof Cover>
export const Cover = z.object({
    title: z.string().max(64),
    author: z.string().max(32),
    tagline: z.string().max(128),
    blurb: z.string().max(512),
    testimonial_quote: z.string().max(256),
    testimonial_name: z.string().max(64),
})