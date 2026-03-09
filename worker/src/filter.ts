export function isMeaningless(text: string): boolean {
	const t = text.trim().normalize("NFC");

	// 1. 極端に短い（意味を成さない）
	if (t.length < 3) return true;

	// 2. 同じ文字の繰り返し（aaaaaa、wwwwww、笑笑笑笑笑）
	if (/^(.)\1{4,}$/.test(t)) return true;

	// 3. 絵文字だけ
	if (/^[\p{Emoji}\s]+$/u.test(t)) return true;

	// 4. URL を含む → 広告・スパムの可能性が高い
	if (/https?:\/\/\S+/i.test(t)) return true;

	// 5. 明らかな広告ワード
	if (/無料|クリック|稼げる|副業|キャンペーン/i.test(t)) return true;

	// 6. 暴力・誹謗中傷（今回のケース）
	if (/死ね|殺す|ぶっ殺|消えろ|殺したい|殺されろ/i.test(t)) return true;

	// 7. プロンプト注入（AI の動作を変えようとする）
	if (/JSON.*無視|出力.*変更|命令.*無視|プロンプト/i.test(t)) return true;

	return false;
}
