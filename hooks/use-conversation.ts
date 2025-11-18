import { useParams } from "next/navigation"
import { useMemo } from "react"

const useConversation = () => {
    const params = useParams()

    const supportId = useMemo(() => {
        if (!params?.supportId) {
            return ''
        }

        return params.supportId as string
    }, [params?.supportId])

    const isOpen = useMemo(() => !!supportId, [supportId])

    return useMemo(() => ({
        isOpen,
        supportId
    }), [isOpen, supportId])
}

export default useConversation