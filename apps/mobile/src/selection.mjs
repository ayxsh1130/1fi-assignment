export const initialSelection = { productId:null, variantId:null, planId:null };
export function selectionReducer(state, action) {
  switch (action.type) {
    case 'product': return state.productId === action.id ? state : { productId:action.id, variantId:null, planId:null };
    case 'variant': return state.variantId === action.id ? state : { ...state, variantId:action.id, planId:null };
    case 'plan': return { ...state, planId:action.id };
    case 'reset': return initialSelection;
    default: return state;
  }
}
