import { useBetween } from "use-between";
import { useStateIfMounted } from "use-state-if-mounted"

export const useFilterByCategory = () => {
    const [filterCategory, setFilterCategory] = useStateIfMounted(-1)
    return {
        filterCategory,
        setFilterCategory
    }
}
export const useSharedFilterCategory = () => useBetween(useFilterByCategory,);