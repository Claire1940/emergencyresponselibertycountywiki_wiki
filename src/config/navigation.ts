import type { LucideIcon } from 'lucide-react'
import {
	Ticket,
	BookOpen,
	Coins,
	Shield,
	Siren,
	Car,
	Bell,
} from 'lucide-react'

export interface NavigationItem {
	key: string // 用于翻译键，如 'codes' -> t('nav.codes')
	path: string // URL 路径，如 '/codes'
	icon: LucideIcon // Lucide 图标组件
	isContentType: boolean // 是否对应 content/ 目录
}

// 导航分类（与 content/en 下的目录一一对应；community 不进导航栏）
export const NAVIGATION_CONFIG: NavigationItem[] = [
	{ key: 'codes', path: '/codes', icon: Ticket, isContentType: true },
	{ key: 'guide', path: '/guide', icon: BookOpen, isContentType: true },
	{ key: 'money', path: '/money', icon: Coins, isContentType: true },
	{ key: 'police', path: '/police', icon: Shield, isContentType: true },
	{ key: 'crime', path: '/crime', icon: Siren, isContentType: true },
	{ key: 'vehicles', path: '/vehicles', icon: Car, isContentType: true },
	{ key: 'updates', path: '/updates', icon: Bell, isContentType: true },
]

// 从配置派生内容类型列表（用于路由和内容加载）
export const CONTENT_TYPES = NAVIGATION_CONFIG.filter((item) => item.isContentType).map(
	(item) => item.path.slice(1),
) // 移除开头的 '/' -> ['codes', 'guide', ...]

export type ContentType = (typeof CONTENT_TYPES)[number]

// 辅助函数：验证内容类型
export function isValidContentType(type: string): type is ContentType {
	return CONTENT_TYPES.includes(type as ContentType)
}
