import {z} from "zod";

export const volunteerRegistrationSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  address: z.string(),
  availability: z.array(z.number()),
  preferredTime: z.array(z.string()),
  interests: z.array(z.string()),
});
export type VolunteerRegistrationSchema = z.infer<
  typeof volunteerRegistrationSchema
>;

export const institutionRegistrationSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  website: z.string(),
  phoneNumber: z.string(),
  country: z.string(),
  province: z.string(),
  city: z.string(),
  address: z.string(),
  postalCode: z.string(),
  organizationType: z.string(),
  organizationSize: z.string(),
  typeOfHelp: z.array(z.string()),
});
export type InstitutionRegistrationSchema = z.infer<
  typeof institutionRegistrationSchema
>;
