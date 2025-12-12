import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Img,
	Link,
	Preview,
	Section,
	Text
} from "@react-email/components"
import React from "react"

interface ResetPasswordTemplateProps {
	domain: string
	token: string
}

/**
 * Красивый шаблон письма для восстановления пароля на форуме Mirchan.
 * Современный дизайн с брендингом, градиентной кнопкой и адаптивной версткой.
 *
 * @param {ResetPasswordTemplateProps} props - Домен и токен для генерации ссылки.
 * @returns {JSX.Element} Сгенерированный шаблон письма.
 */
export function ResetPasswordTemplate({
	domain,
	token
}: ResetPasswordTemplateProps) {
	const resetLink = `${domain}/auth/new-password?token=${token}`

	return (
		<Html>
			<Head />
			<Preview>Восстановите доступ к аккаунту Mirchan 🔐</Preview>
			<Body style={main}>
				<Container style={container}>
					{/* Логотип и заголовок */}
					<Section style={header}>
						<Heading style={logo}>🌐 Mirchan</Heading>
						<Text style={tagline}>Восстановление доступа к вашему аккаунту</Text>
					</Section>

					{/* Основной контент */}
					<Section style={content}>
						<Heading style={h1}>🔐 Сброс пароля</Heading>

						<Text style={text}>
							Мы получили запрос на сброс пароля для вашего аккаунта на <strong>Mirchan</strong>.
						</Text>

						<Text style={text}>
							Не волнуйтесь! Нажмите на кнопку ниже, чтобы создать новый безопасный пароль:
						</Text>

						{/* Кнопка с градиентом */}
						<Section style={buttonContainer}>
							<Button style={button} href={resetLink}>
								🔑 Создать новый пароль
							</Button>
						</Section>

						<Text style={textSmall}>
							Или скопируйте эту ссылку в браузер:
						</Text>
						<Link href={resetLink} style={link}>
							{resetLink}
						</Link>

						<Hr style={hr} />

						{/* Информация о безопасности */}
						<Section style={securityBox}>
							<Text style={securityTitle}>🛡️ Важная информация</Text>
							<Text style={securityText}>
								• Ссылка действительна <strong>1 час</strong>
								<br />
								• Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо
								<br />
								• Никогда не передавайте эту ссылку третьим лицам
								<br />
								• После сброса старый пароль перестанет работать
							</Text>
						</Section>

						{/* Дополнительная помощь */}
						<Section style={helpBox}>
							<Text style={helpTitle}>❓ Нужна помощь?</Text>
							<Text style={helpText}>
								Если у вас возникли проблемы с восстановлением доступа, напишите нам на{' '}
								<Link href={`mailto:support@${domain.split('//')[1]}`} style={helpLink}>
									support@{domain.split('//')[1]}
								</Link>
							</Text>
						</Section>
					</Section>

					{/* Футер */}
					<Section style={footer}>
						<Text style={footerText}>
							© {new Date().getFullYear()} Mirchan Forum. Все права защищены.
						</Text>
						<Text style={footerLinks}>
							<Link href={`${domain}/about`} style={footerLink}>О проекте</Link>
							{' • '}
							<Link href={`${domain}/rules`} style={footerLink}>Правила</Link>
							{' • '}
							<Link href={`${domain}/support`} style={footerLink}>Поддержка</Link>
						</Text>
						<Text style={footerSmall}>
							Это автоматическое письмо, отвечать на него не нужно.
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	)
}

// Стили
const main = {
	backgroundColor: '#f6f9fc',
	fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
	backgroundColor: '#ffffff',
	margin: '0 auto',
	padding: '20px 0 48px',
	marginBottom: '64px',
	maxWidth: '600px',
	borderRadius: '12px',
	boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
}

const header = {
	padding: '32px 40px',
	textAlign: 'center' as const,
	background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
	borderRadius: '12px 12px 0 0',
}

const logo = {
	color: '#ffffff',
	fontSize: '32px',
	fontWeight: 'bold',
	margin: '0 0 8px',
	textAlign: 'center' as const,
}

const tagline = {
	color: '#e0e7ff',
	fontSize: '14px',
	margin: '0',
	textAlign: 'center' as const,
}

const content = {
	padding: '40px',
}

const h1 = {
	color: '#1f2937',
	fontSize: '28px',
	fontWeight: 'bold',
	margin: '0 0 24px',
	textAlign: 'center' as const,
}

const text = {
	color: '#374151',
	fontSize: '16px',
	lineHeight: '26px',
	margin: '16px 0',
}

const textSmall = {
	color: '#6b7280',
	fontSize: '14px',
	lineHeight: '22px',
	margin: '16px 0 8px',
}

const buttonContainer = {
	textAlign: 'center' as const,
	margin: '32px 0',
}

const button = {
	backgroundColor: '#667eea',
	background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
	borderRadius: '8px',
	color: '#ffffff',
	fontSize: '16px',
	fontWeight: 'bold',
	textDecoration: 'none',
	textAlign: 'center' as const,
	display: 'inline-block',
	padding: '14px 32px',
	boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
	transition: 'all 0.3s ease',
}

const link = {
	color: '#667eea',
	fontSize: '14px',
	textDecoration: 'underline',
	wordBreak: 'break-all' as const,
}

const hr = {
	borderColor: '#e5e7eb',
	margin: '32px 0',
}

const securityBox = {
	backgroundColor: '#f3f4f6',
	borderRadius: '8px',
	padding: '20px',
	margin: '24px 0',
}

const securityTitle = {
	color: '#1f2937',
	fontSize: '16px',
	fontWeight: 'bold',
	margin: '0 0 12px',
}

const securityText = {
	color: '#4b5563',
	fontSize: '14px',
	lineHeight: '22px',
	margin: '0',
}

const helpBox = {
	backgroundColor: '#ecfdf5',
	borderRadius: '8px',
	padding: '20px',
	margin: '24px 0',
	border: '1px solid #d1fae5',
}

const helpTitle = {
	color: '#065f46',
	fontSize: '16px',
	fontWeight: 'bold',
	margin: '0 0 12px',
}

const helpText = {
	color: '#047857',
	fontSize: '14px',
	lineHeight: '22px',
	margin: '0',
}

const helpLink = {
	color: '#059669',
	textDecoration: 'underline',
	fontWeight: 'bold',
}

const footer = {
	padding: '0 40px 32px',
	textAlign: 'center' as const,
}

const footerText = {
	color: '#6b7280',
	fontSize: '14px',
	margin: '8px 0',
}

const footerLinks = {
	color: '#6b7280',
	fontSize: '14px',
	margin: '8px 0',
}

const footerLink = {
	color: '#667eea',
	textDecoration: 'none',
}

const footerSmall = {
	color: '#9ca3af',
	fontSize: '12px',
	margin: '16px 0 0',
}