# Supabase Auth Email Templates — FlowBoss

Paste each template into the matching slot at **Supabase Dashboard →
Authentication → Email Templates**.

Supabase template variables available:

| Variable | Meaning |
|---|---|
| `{{ .ConfirmationURL }}` | The action link (auto-generated) |
| `{{ .Token }}` | 6-digit OTP (if you want code-based instead of link) |
| `{{ .Email }}` | Recipient's current email |
| `{{ .NewEmail }}` | (Change Email only) the new email address |
| `{{ .SiteURL }}` | Your Supabase-configured Site URL |

All templates:
- Are mobile-responsive (single column, max-width 480px)
- Use inline styles (HTML email requirement)
- Ship with a plain-text fallback implicit via the formatting
- Match FlowBoss brand: blue gradient header, wrench logo, clean sans-serif

The **subject line** for each template is listed in the corresponding
.html file as an HTML comment at the top. Copy that into the "Subject"
field in Supabase.

---

## Why these exist

By default Supabase sends transactional emails from
`noreply@mail.app.supabase.io` using generic templates. For real users
that reads as phishing. These templates + Resend SMTP configuration
(see SUPABASE_EMAIL_SETUP.md) make the emails come from `@flowboss.io`
with on-brand design.
